# JetStream 模型深入解析

## Stream 限制、保留与策略

Stream 会把数据存储在磁盘上，但我们不可能永远保存所有数据，因此需要一些机制来自动控制 Stream 的规模。

当 Stream 决定“消息要保留多久”时，主要会涉及 3 个方面。

`Retention Policy`（保留策略）描述了系统依据什么标准从存储中逐出（evict）消息：

| Retention Policy  | 说明 |
| ----------------- | ---- |
| `LimitsPolicy`    | 通过限制“消息条数 / 总存储大小 / 消息最大年龄”来决定保留范围。 |
| `WorkQueuePolicy` | 消息会一直保留到被消费为止：也就是消息被投递给订阅应用（由某个 Consumer 根据 subject 过滤接收）。在这种模式下，同一条 Stream 覆盖到的每个 subject 同一时刻只能有一个 Consumer（不允许重叠 Consumer）。应用必须显式 ACK 该消息。 |
| `InterestPolicy`  | 只要 Stream 上还存在 Consumer（若 Consumer 做了过滤，则需匹配消息 subject）且该消息尚未被 ACK，就会继续保留。只有当当前定义的所有 Consumer 都已收到订阅应用对该消息的显式 ACK 后，消息才会从 Stream 中删除。 |

在所有保留策略下，基础的上限限制都会生效：`MaxMsgs`（最多保留多少条消息）、`MaxBytes`（最多占用多少总字节数）以及 `MaxAge`（最多保留多老的消息）。在 `LimitsPolicy` 下，只有这些上限限制参与决策。

你还可以定义一些“让消息早于上限被删除”的条件：

- 在 `WorkQueuePolicy` 中，只要该 Consumer 收到消息的 ACK，消息就会被移除。
- 在 `InterestPolicy` 中，只要该 subject 上的所有 Consumer 都对该消息做了 ACK，消息就会被移除。

在 `WorkQueuePolicy` 与 `InterestPolicy` 中，年龄、大小与数量这三类上限限制仍然作为“硬上限”存在。

最后还有一个重要控制项：单条消息的最大尺寸。NATS 本身对最大消息尺寸有默认限制（默认 1 MiB），但你也可以通过 `MaxMsgSize` 指定某个 Stream 只接受不超过 1024 字节的消息。

`Discard Policy` 用于规定当 `LimitsPolicy` 的限制被触发时，如何丢弃消息：

- `DiscardOld`：丢弃旧消息，为新消息腾出空间
- `DiscardNew`：拒绝新消息

`WorkQueuePolicy` 是一种特殊模式：消息一旦被消费并 ACK，就会从 Stream 中删除。

## 消息去重（Message Deduplication）

JetStream 通过 `Nats-Msg-Id` header 来识别重复消息：当检测到重复时会忽略写入，从而支持幂等写入。

```shell
nats req -H Nats-Msg-Id:1 ORDERS.new hello1
nats req -H Nats-Msg-Id:1 ORDERS.new hello2
nats req -H Nats-Msg-Id:1 ORDERS.new hello3
nats req -H Nats-Msg-Id:1 ORDERS.new hello4
```

这里我们设置了 `Nats-Msg-Id:1`，告诉 JetStream：请确保这条消息不会重复写入。去重只会参考消息 ID，而不会比较 body。

```shell
nats stream info ORDERS
```

从输出可以看到：系统检测到了重复发布，Stream 实际只存储了一条消息（第一条）。

```
....
State:

            Messages: 1
               Bytes: 67 B
```

默认的去重时间窗口是 2 分钟。创建 Stream 时可以用 `--dupe-window` 调整该窗口，但不建议设置得过大。

## 确认（Acknowledgement）模型

Stream 支持对“已接收并已存储消息”进行确认：如果你对 Stream 配置覆盖的 subject 执行 `Request()`，服务会在消息被存储后回复你；但如果你只是 publish，则不会收到这类确认。你也可以在 Stream 配置中将 `NoAck` 设为 `true` 来禁用确认。

Consumer 有 3 种确认模式：

| Mode          | 说明 |
| ------------- | ---- |
| `AckExplicit` | 每条消息都必须单独 ACK；这是 pull-based Consumer 唯一支持的选项 |
| `AckAll`      | ACK 了第 `100` 条时，也会连带 ACK `1`-`99`；适合批处理，可减少 ACK 开销 |
| `AckNone`     | 不支持 ACK |

为了理解 Consumer 如何跟踪消息状态，我们从一个干净的 `ORDERS` Stream 和 `DISPATCH` Consumer 开始。

```shell
nats str info ORDERS
```

```
...
Statistics:

            Messages: 0
               Bytes: 0 B
            FirstSeq: 0
             LastSeq: 0
    Active Consumers: 1
```

Stream 目前完全为空。

```shell
nats con info ORDERS DISPATCH
```

```
...
State:

  Last Delivered Message: Consumer sequence: 1 Stream sequence: 1
    Acknowledgment floor: Consumer sequence: 0 Stream sequence: 0
        Pending Messages: 0
    Redelivered Messages: 0
```

该 Consumer 没有任何未完成消息，并且从未处理过消息（Consumer sequence 为 1）。

向 Stream 发布一条消息，并确认 Stream 已接收：

```shell
nats pub ORDERS.processed "order 4"
```

```
Published 7 bytes to ORDERS.processed
$ nats str info ORDERS
...
Statistics:

            Messages: 1
               Bytes: 53 B
            FirstSeq: 1
             LastSeq: 1
    Active Consumers: 1
```

由于这个 Consumer 是 pull-based 的，我们可以拉取消息、ACK，并查看 Consumer 状态：

```shell
nats con next ORDERS DISPATCH
```

```
--- received on ORDERS.processed
order 4

Acknowledged message

$ nats con info ORDERS DISPATCH
...
State:

  Last Delivered Message: Consumer sequence: 2 Stream sequence: 2
    Acknowledgment floor: Consumer sequence: 1 Stream sequence: 1
        Pending Messages: 0
    Redelivered Messages: 0
```

消息已投递并完成 ACK：`Acknowledgement floor` 为 `1` 与 `1`；Consumer 的 sequence 为 `2`，表示它只处理过这一条消息且已 ACK。因为已经 ACK，所以没有 pending，也不会重投递。

再发布一条消息；这次拉取但不 ACK，观察状态：

```shell
nats pub ORDERS.processed "order 5"
```

```
Published 7 bytes to ORDERS.processed
```

从 Consumer 获取下一条消息（但不要确认它）

```shell
nats consumer next ORDERS DISPATCH --no-ack
```

```
--- received on ORDERS.processed
order 5
```

查看 Consumer 信息

```shell
nats consumer info ORDERS DISPATCH
```

```
State:

  Last Delivered Message: Consumer sequence: 3 Stream sequence: 3
    Acknowledgment floor: Consumer sequence: 1 Stream sequence: 1
        Pending Messages: 1
    Redelivered Messages: 0
```

现在可以看到：Consumer 处理过 2 次投递（观察到 sequence 为 3，表示下一条将是第 3 次投递），但 Ack floor 仍然是 1，因此有 1 条消息处于“待确认（pending）”状态，这也在 `Pending Messages` 中得到了印证。

如果我反复拉取它，但一直不 ACK：

```shell
nats consumer next ORDERS DISPATCH --no-ack
```

```
--- received on ORDERS.processed
order 5
```

再次查看 Consumer 信息

```shell
nats consumer info ORDERS DISPATCH
```

```
State:

  Last Delivered Message: Consumer sequence: 4 Stream sequence: 3
    Acknowledgment floor: Consumer sequence: 1 Stream sequence: 1
        Pending Messages: 1
    Redelivered Messages: 1
```

Consumer sequence 会增加——每一次投递尝试都会增加序号——同时 `Redelivered Messages` 也会递增。

最后，再拉取一次并在这次进行 ACK：

```shell
nats consumer next ORDERS DISPATCH 
```

```
--- received on ORDERS.processed
order 5

Acknowledged message
```

查看 Consumer 信息

```shell
nats consumer info ORDERS DISPATCH
```

```
State:

  Last Delivered Message: Consumer sequence: 5 Stream sequence: 3
    Acknowledgment floor: Consumer sequence: 1 Stream sequence: 1
        Pending Messages: 0
    Redelivered Messages: 0
```

现在消息已被 ACK，因此不再有 pending。

另外，还有几种 ACK 类型：

| Type          | Bytes       | 说明 |
| ------------- | ----------- | ---- |
| `AckAck`      | nil, `+ACK` | 确认消息已被完整处理 |
| `AckNak`      | `-NAK`      | 表示“当前不处理该消息”，可以继续处理下一条；被 NAK 的消息会被重试 |
| `AckProgress` | `+WPI`      | 在 AckWait 到期前发送，表示工作仍在进行；AckWait 会再延长一个同样长度的周期 |
| `AckNext`     | `+NXT`      | 确认当前消息已处理，并请求将下一条消息投递到 reply subject；仅适用于 Pull 模式 |
| `AckTerm`     | `+TERM`     | 指示服务器停止对该消息的重投递，但并不表示它被成功处理 |

到目前为止，示例使用的都是 `AckAck`。你可以根据 `Bytes` 列所示的 body 内容来选择想要的 ACK 模式。注意：这里描述的是 JetStream 的内部协议细节；各客户端库通常提供了更高层的 API 来完成上述 ACK，你无需关心底层 payload。

除 `AckNext` 外，以上 ACK 模式都支持“双重确认”（double acknowledgement）：如果你在 ACK 时设置 reply subject，服务器会再回复一次，确认它已经收到你的 ACK。

`+NXT` 有几种格式：例如 `+NXT 10` 表示请求 10 条消息；`+NXT {"no_wait": true}` 表示携带与 Pull Request 相同结构的数据。

## “恰好一次”（Exactly Once）语义

JetStream 通过结合“消息去重”和“双重确认”，支持“恰好一次”的发布与消费语义。

在发布侧，你可以通过 [消息去重](model\_deep\_dive.md#message-deduplication) 来避免重复写入。

在消费侧，若希望 100% 确认消息确实被正确处理，可以要求服务器确认“已收到你的 ACK”（也称 double-acking）。做法是调用消息的 `AckSync()`（而非 `Ack()`）：它会在 ACK 上设置 reply subject，并等待服务器对“ACK 已接收并处理”的回应。如果服务器返回成功，你就可以确信：因为 ACK 丢失而导致的再次重投递不会发生。

## Consumer 的起始位置

创建 Consumer 时，你可以决定从哪里开始投递。系统通过 `DeliverPolicy` 支持以下起点：

| Policy              | 说明 |
| ------------------- | ---- |
| `all`               | 投递所有可用消息 |
| `last`              | 只投递最新一条消息，类似 `tail -n 1 -f` |
| `new`               | 只投递订阅开始之后新到达的消息 |
| `by_start_time`     | 从指定时间点之后开始投递；需要设置 `OptStartTime` |
| `by_start_sequence` | 从指定的 Stream 序列号开始投递；需要设置 `OptStartSeq` |

无论你选择哪种策略，这都只是“起点”。一旦开始投递，Consumer 会持续给你你尚未见过或尚未确认的消息。因此，上述策略只决定“第一条消息从哪里开始”。

我们逐一看看这些策略。首先创建一个新 Stream `ORDERS`，并向其中写入 100 条消息。

创建一个 `DeliverAll` 的 pull-based Consumer：

```shell
nats consumer add ORDERS ALL --pull --filter ORDERS.processed --ack none --replay instant --deliver all 
nats consumer next ORDERS ALL
```

```
--- received on ORDERS.processed
order 1

Acknowledged message
```

创建一个 `DeliverLast` 的 pull-based Consumer：

```shell
nats consumer add ORDERS LAST --pull --filter ORDERS.processed --ack none --replay instant --deliver last
nats consumer next ORDERS LAST
```

```
--- received on ORDERS.processed
order 100

Acknowledged message
```

创建一个从第 10 条开始的 pull-based Consumer：

```shell
nats consumer add ORDERS TEN --pull --filter ORDERS.processed --ack none --replay instant --deliver 10
nats consumer next ORDERS TEN
```

```
--- received on ORDERS.processed
order 10

Acknowledged message
```

最后是基于时间的 Consumer。先每隔 1 分钟写入一条消息：

```shell
nats stream purge ORDERS
for i in 1 2 3
do
  nats pub ORDERS.processed "order ${i}"
  sleep 60
done
```

然后创建一个从 2 分钟前开始的 Consumer：

```shell
nats consumer add ORDERS 2MIN --pull --filter ORDERS.processed --ack none --replay instant --deliver 2m
nats consumer next ORDERS 2MIN
```

```
--- received on ORDERS.processed
order 2

Acknowledged message
```

## 临时（Ephemeral）Consumer

到目前为止，你看到的 Consumer 都是 Durable 的：即使你断开与 JetStream 的连接，它们仍然存在。在订单（Orders）场景中，像 `MONITOR` 这样的 Consumer 可能只是在运维排查时短暂存在；如果你只是想观察实时状态，就没必要记住“上次看到的位置”。

这种情况下，我们可以创建 Ephemeral Consumer：先订阅投递 subject，然后创建 Consumer 时不设置 durable 名称。Ephemeral Consumer 只要其投递 subject 上还有活跃订阅就会存在；当没有订阅者时（会有一个很短的宽限期用于处理重启），系统会自动将其删除。

Terminal 1:

```shell
nats sub my.monitor
```

Terminal 2:

```shell
nats consumer add ORDERS --filter '' --ack none --target 'my.monitor' --deliver last --replay instant --ephemeral
```

`--ephemeral` 选项用于告诉系统创建 Ephemeral Consumer。

## Consumer 的消息投递速率

通常情况下，你希望新建 Consumer 后，消息能尽快投递给你。但有时你希望按“原始到达速率”回放：例如消息最初每分钟到达一次，那么你新建 Consumer 后也希望每分钟收到一条。

这在压测等场景很有用。该行为由 `ReplayPolicy` 控制，取值包括 `ReplayInstant` 与 `ReplayOriginal`。

`ReplayPolicy` 只能用于 push-based Consumer。

```shell
nats consumer add ORDERS REPLAY --target out.original --filter ORDERS.processed --ack none --deliver all --sample 100 --replay original
```

```
...
     Replay Policy: original
...
```

Now let's publish messages into the Set 10 seconds apart:

```shell
for i in 1 2 3                                                                                                                                                      <15:15:35
do
  nats pub ORDERS.processed "order ${i}"
  sleep 10
done
```

```
Published [ORDERS.processed] : 'order 1'
Published [ORDERS.processed] : 'order 2'
Published [ORDERS.processed] : 'order 3'
```

And when we consume them they will come to us 10 seconds apart:

```shell
nats sub -t out.original
```

```
Listening on [out.original]
2020/01/03 15:17:26 [#1] Received on [ORDERS.processed]: 'order 1'
2020/01/03 15:17:36 [#2] Received on [ORDERS.processed]: 'order 2'
2020/01/03 15:17:46 [#3] Received on [ORDERS.processed]: 'order 3'
^C
```

## ACK 采样（Ack Sampling）

前面的章节提到系统会向监控系统发送采样数据。这里我们深入看看：采样是如何工作的，以及采样内容包含什么。

当消息经过某个 Consumer 时，你通常会关心：有多少消息发生了重投递、重投递了多少次，以及消息从投递到被 ACK 的耗时。

Consumer 可以对已 ACK 的消息进行采样，并将样本发布出去，供监控系统观察该 Consumer 的健康状况。我们将把这一能力加入到 [NATS Surveyor](https://github.com/nats-io/nats-surveyor) 中。

### 配置

你可以在 `nats consumer add` 时通过 `--sample 80` 为 Consumer 启用采样，表示对 80% 的 ACK 进行采样。

查看 Consumer 信息时，可以判断是否启用了采样：

```shell
nats consumer info ORDERS NEW
```

输出中会包含：

```
...
     Sampling Rate: 100
...
```

## 存储开销（Storage Overhead）

JetStream 的文件存储非常高效，会尽可能少地存储与消息相关的额外信息。

但每条消息仍会附带存储一些数据，包括：

* 消息 headers
* 接收时的 subject
* 接收时间
* 消息 payload
* 消息 hash
* 消息序列号
* 其他一些信息，例如 subject 的长度、headers 的长度等

不带 headers 时，记录大小为：

```
length of the message record (4bytes) + seq(8) + ts(8) + subj_len(2) + subj + msg + hash(8)
```

一条 5 字节的 `hello` 消息（无 headers）会占用 39 字节。

带 headers 时：

```
length of the message record (4bytes) + seq(8) + ts(8) + subj_len(2) + subj + hdr_len(4) + hdr + msg + hash(8)
```

因此，如果你发布大量小消息，相对开销会显得比较大；而对大消息来说，相对开销则很小。如果你的业务会发布很多小消息，值得考虑优化 subject 的长度。
