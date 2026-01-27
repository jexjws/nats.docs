# NATS 2.11

本指南面向正在从 NATS v2.10.x 升级的现有 NATS 用户。内容以摘要形式呈现，并提供指向具体文档页面的链接，便于你进一步了解每个特性或改进。

## 功能

### 可观测性（Observability）

* **分布式消息追踪：** 现在用户可以在消息流经系统时进行追踪：通过设置 `Nats-Trace-Dest` header 为某个 inbox subject。
  消息路径上的 server 会把事件发送回该 subject，报告消息何时进入/离开某个 server、是通过哪种连接类型、何时发生 subject mapping、或何时穿越 account import/export 边界。
  另外，如果把 `Nats-Trace-Only` header 设为 true，则 tracing 事件可以在某个 subject 上传播，但不会把消息投递给该 subject 的订阅者。

### Streams

* **JetStream 按消息 TTL：** 现在可以用“按消息的 TTL”让单条消息过期（age out）。`Nats-TTL` header（字符串或整数格式，单位为秒）允许单条消息在不依赖 stream 上限的情况下独立过期；并可与 stream 现有的其它限制组合使用。更多信息见 [ADR-43](https://github.com/nats-io/nats-architecture-and-design/blob/main/adr/ADR-43.md)。
* **MaxAge 的 subject 删除标记（delete marker）：** `SubjectDeleteMarkerTTL` stream 配置项允许在配置的 `MaxAge` 导致某个 subject 的最后一条消息被删除时，在 stream 中放置一条 delete marker 消息。delete marker 包含 `Nats-Marker-Reason` header，用于说明是哪项限制触发了删除。
* **Stream 写入速率限制：** 在 `jetstream` 配置块中新增 `max_buffered_size` 和 `max_buffered_msgs`，用于对 Core NATS 发布进入 JetStream stream 的速率做限制，防止系统过载。

### Consumers

* **Pull consumer 优先级组：** Pull consumer 现在支持带 pinning（绑定）与 overflow（溢出）的优先级组，使多个 client 从同一 consumer 拉取时，能够实现更灵活的故障切换与优先级管理。
  可以基于 consumer 上的 pending messages 数量或 pending acks 数量来配置策略，控制消息何时从一个 client 溢出到另一个 client，从而启用新的设计模式或“区域感知（regional awareness）”。
* **Consumer 暂停：** 可以使用新的 pause API endpoint（或创建时使用 `PauseUntil` 配置项）临时暂停向 consumer 投递消息，适合维护或迁移。
  当配置的截止时间到达后，消息投递会自动恢复。consumer client 仍会照常收到 heartbeat，以确保暂停期间不暴露错误。

### 运维（Operations）

* **资产账号中的复制流量：** 使用 JetStream account settings 中的 [`cluster_traffic` 属性](../running-a-nats-service/configuration/#jetstream-account-settings)，可以按 account 把 Raft 复制流量移动到“资产所在的 account”中，而不是通过 system account 发送/接收。
  配合多 route 连接，可以降低延迟，并避免在高负载多租户/多账号部署中出现 head-of-line blocking。
* **Leafnode 连接 TLS first：** 在 leafnode 的 `tls` 块中新增 `handshake_first`，可让 leafnode 连接先进行 TLS 协商，再进行其它协议握手。
* **配置状态摘要（digest）：** server 二进制新增 `-t` 命令行参数，可以生成配置文件的 hash。`varz` 中的 `config_digest` 会显示当前运行配置文件的 hash，从而可检查“磁盘上的配置文件”是否与“正在运行的配置”一致。
* **Windows 上的 TPM 加密：** 在 Windows 上运行时，filestore 现在可以把加密密钥存储在 TPM 中，适用于对物理接触有顾虑的环境。

### MQTT

* **SparkplugB：** 内置 MQTT 支持现在符合 SparkplugB Aware，并支持 `NBIRTH` 与 `NDEATH` 消息。

## 改进

* **复制化的 delete 提案：** 在集群化的 interest-based 或 workqueue stream 中，消息删除现在会通过 Raft 进行传播，以保证各副本的删除顺序一致，从而减少因集群故障导致 stream 不同步的可能性。
* **Metalayer、stream 与 consumer 一致性：** 新 leader 只有在与其 Raft log 同步后才会响应读写请求，避免在 leader 切换期间 KV 更新与 stream 之间出现不一致。
* **复制化 consumer 可靠性：** 复制化 consumer 现在会在 leader 变更后稳定地重投递未 ACK 的消息。
* **Consumer 起始序列：** consumer 的起始序列现在总会被遵守（sources/mirrors 的内部隐藏 consumer 除外）。

## 升级注意事项

#### Stream 写入速率限制

当某个 stream 缓冲队列中排队的消息过多时，NATS Server 现在可能返回 429 错误，类型为 `JSStreamTooManyRequests`。

通常情况下，如果你使用 JetStream publish 并等待 PubAck，不太可能触发该限制；但如果你使用 Core NATS publish 直接发布到 JetStream，而不等待 PubAck（这并不推荐），就可能触发。

新的 `max_buffered_size` 与 `max_buffered_msgs` 控制每个 stream 在触发速率限制之前最多可排队多少消息。因此如有需要，你可以在部署中提高这些上限。
默认值分别是 128MB 和 10,000；而在 v2.10 中它们是无限制的。

你可以通过 server 日志中的以下 warning 来判断是否遇到了队列上限：

```
[WRN] Dropping messages due to excessive stream ingest rate on 'account' > 'my-stream': IPQ len limit reached
```

如果你的应用开始出现上述 warning，建议先把上限调高，同时排查是否存在“发布过快”的发布者，例如：

```
jetstream {
  max_buffered_msgs: 50000
  max_buffered_size: 256mib
}
```

#### 复制化的 delete 提案

由于复制化 stream 的删除现在通过 group proposals 复制，复制流量可能会略有增加。

#### JetStream 健康检查

在 v2.11.0 中，`js-server-only` healthcheck 不再检查 metaleader 的健康状况。
这个 healthcheck 的目标是检测 server 的就绪状态（例如 k8s readiness probe），而检查 metaleader 有时会导致 server 重启期间被判定为不健康。
在 v2.11 中这将不再是问题。

如果你仍然更喜欢 v2.10 的旧行为，可以使用新的 `js-meta-only` healthcheck 选项来检查 meta group 是否健康。

#### 退出码

早期版本的 NATS Server 在优雅关闭（例如 SIGTERM）后会返回退出码 1。从 v2.11 开始，将返回退出码 0。

#### Server、cluster 与 gateway 名称

包含空格的 server/cluster/gateway 名称现在被视为无效，因为这会在协议层面造成问题。
NATS v2.11 如果配置了带空格的名称将启动失败。请确保这些名称中不包含空格。

## 降级注意事项

#### Stream 状态

从 v2.11 降级到 v2.10 时，由于 v2.11 更改了磁盘上的 stream state 文件格式，降级后会重建这些文件。
重建需要重新扫描所有 stream 的消息块，可能会比平时占用更高 CPU，也会导致重启节点更久才会报告健康。
这只会发生在降级后的第一次重启，并不会造成数据丢失。
