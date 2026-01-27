# NATS 2.12

本指南面向正在从 NATS v2.11.x 升级的现有 NATS 用户。内容以摘要形式呈现，并提供指向具体文档页面的链接，便于你进一步了解每个特性或改进。

## 功能

### Streams

* **原子化批量发布：** `AllowAtomicPublish` stream 配置项允许将 $N$ 条消息以“原子方式”发布到一个 stream 中。
  该功能同时支持复制与非复制 stream，并支持在提交批次之前做逐条一致性检查。
  更多信息见 [ADR-50](https://github.com/nats-io/nats-architecture-and-design/blob/main/adr/ADR-50.md)。

* **分布式计数器 CRDT：** `AllowMsgCounter` stream 配置项允许在 stream 上实现计数器语义（增/减）。
  这些计数器 stream 也可以通过 stream mirroring 与 sourcing 被镜像或聚合。
  更多信息见 [ADR-49](https://github.com/nats-io/nats-architecture-and-design/blob/main/adr/ADR-49.md)

* **延迟消息调度：** `AllowMsgSchedules` stream 配置项允许对消息进行调度（scheduling）。
  用户可以用该功能实现延迟发布/定时发布。
  更多信息见 [ADR-51](https://github.com/nats-io/nats-architecture-and-design/blob/main/adr/ADR-51.md)

### Consumers

* **优先级 pull consumer 策略：** 除 overflow（溢出）或 client pinning（绑定）等策略外，新增了 `prioritized` 策略。
  与 overflow 策略不同，它允许 consumer 更快地把消息切换给另一个 client（而不是延迟 failover），但代价是工作可能在不同 client 之间来回切换（flip-flopping）。
  更多信息见 [ADR-42](https://github.com/nats-io/nats-architecture-and-design/blob/main/adr/ADR-42.md#prioritized-policy)

### 运维（Operations）

* **Server 元数据：** 类似于 `server_tags`（描述 server 的一组标签），`server_metadata` 是一个 map，包含描述 server 元数据的字符串键和值。

* **提升 mirrors：** 一个正在作为 mirror 的 stream 现在可以被提升为 primary，从而启用新的灾备方案。
  在提升 mirrors 之前，应先删除当前 primary stream，或移除其配置的 subjects；然后再把被提升的 mirrors 配置为开始监听这些 subjects。

* **Route 与 gateway 连接的指数退避：** cluster routes 与 gateways 现在可以在重连时使用指数退避：通过设置 `connect_backoff`。
  若为 `true`，重连间隔将从 1 秒指数增长到最多 30 秒。
  这会降低重连速度，但在 server 重启或故障时能显著减少 DNS 查询与连接尝试量。

* **离线资产（Offline assets）：** 当降级到旧版本时，server 现在可以识别“使用了新特性”的情况，并把对应 stream 和/或 consumer 置为不受支持/离线模式。
  更多信息请阅读降级注意事项，并参考 [ADR-44](https://github.com/nats-io/nats-architecture-and-design/blob/main/adr/ADR-44.md#offline-assets)。

* **Stream/consumer 扩容与磁盘/状态重置保护：** server 现在对“基于空状态触发 leader 选举”的情况有更好的保护，这也提升了复制型 in-memory stream 的可靠性。
  通常需要有 quorum 的 servers 在线且包含数据。现在即使除一台以外的 servers 都重启，in-memory stream 的数据也能可靠地追上。
  但在这种场景下，需要参与该 stream 复制的所有 servers 都可用，而不仅仅是满足 quorum 的数量。
  这让 servers 能做出更合适的决策，以保全数据。

## 改进

* **异步 stream flushing：** 复制型 stream 现在会异步 flush 数据到磁盘 store，性能有显著提升。
  写入复制型 stream 仍会在提交前同步持久化到 Raft log，因此这项性能提升不会牺牲一致性。

* **Filestore 的弹性指针：** file-based stream 现在对写穿缓存使用“弹性指针”，使 server 在垃圾回收期间表现更好。
  在内存紧张时，这些缓存可以更早被驱逐，以避免 OOM（详见下方升级注意事项）。

* **使用 `crypto/tls` 的 cipher suites：** 新 cipher suites 会自动加入。
  另外，不安全的 cipher suites 默认禁用；若要允许，需要启用 `allow_insecure_cipher_suites`。

* **`$G` account 的系统事件：** 全局 account（`$G`）现在也会生成系统事件，例如 connect/disconnect。

* **Server stats 增加 `GOMAXPROCS` 与 `GOMEMLIMIT`：** server stats 之前已包含 CPU/内存使用情况，现在还会包含生效的 Go 限制。

* **新增 subject transforms：`partition(n)` 与 `random(n)`：** 除了 `partition(n, …)`（基于指定索引处的 tokens 计算分区号）之外，新增 `partition(n)` 与 `random(n)` 作为便捷函数：基于整个 subject 生成 $0..n$ 的分区号/随机数。

* **Account 名称与用户日志：** 与 client 连接相关的日志（例如达到最大连接数、认证错误等）现在会包含该连接的 account 名称与 user。

* **日志改进：** 与 client 连接相关的日志现在包含 account 与 user 名称。连接关闭日志也会包含远端 server 名称。

* **隔离 leaf node interest 属性：** 在有大量 leaf nodes 的大规模部署中，东西向 interest 传播可能带来大量流量；如果 leaf nodes 并不需要彼此直接 pub/sub，这些流量就是浪费。
  过去可以通过把这些 leaf nodes 的 cluster name 设置为相同来绕过；现在新增 `isolate_leafnode_interest` 属性来直接支持。

* **通过 config reload 禁用 leaf node 连接：** 在使用 `disabled: true` 时，可以通过配置 reload 来禁用某个 remote leaf node。
  若从 false 改为 true，一个已建立的（solicited）leaf node 会被断开且不会重连；若从 true 改为 false，则会再次发起（solicit）leaf node 连接。

## 升级注意事项

#### 内存使用

由于 filestore 使用了新的弹性指针，运行 2.12 的 NATS Server 可能会呈现与以往不同的内存使用模式。
在某些系统中，RSS 可能更低；在另一些系统中可能更高，取决于资产数量以及发布/访问模式。

这是首次让 server 能够在内存压力下按需释放 filestore 缓存，并把内存归还给操作系统，从而降低“利用率突增导致 OOM kill”的概率。
但这也意味着：当资源允许时，server 会更积极地把缓存留在内存中，以提升读性能。

这一行为主要由 GC 阈值控制，而 GC 阈值由 `GOMEMLIMIT` [环境变量](https://tip.golang.org/doc/gc-guide#Memory_limit) 设定。
你可以根据可用系统内存来调整该值；在 Kubernetes 环境中，也可以结合内存预留来调优。

#### 严格 JetStream API

从 v2.11 开始，如果收到无效的 JetStream 请求，server 会记录类似下面的日志：

```  
[WRN] Invalid JetStream request '$G > $JS.API.STREAM.CREATE.test-stream': json: unknown field "unknown"  
```

从 v2.12 开始，server 不仅会记录日志，还会向 client 返回错误：默认启用“严格模式（strict mode）”，无效请求会被拒绝。

如果你观察到上述日志，请确保应用或 client 向 server 发送了正确的请求，并且 NATS client 库已更新。
如需临时关闭严格模式以争取修复时间，可以在 server 配置中禁用：

```  
jetstream {  
  strict: false  
}  
```

## 降级注意事项

#### Stream 状态

从 v2.12 降级到 v2.11 时，由于 v2.12 更改了磁盘上的 stream state 文件格式，降级后会重建这些文件。
重建需要重新扫描所有 stream 的消息块，可能会比平时占用更高 CPU，也会导致重启节点更久才会报告健康。
这只会发生在降级后的第一次重启，并不会造成数据丢失。

降级时仅建议降级到 v2.11.9 或更高版本。
从该版本起，server 能识别使用了新的 v2.12 特性，并会安全地把使用这些新特性的 stream 和/或 consumer 置为不受支持/离线模式。
重要的是：这既能保护数据，也能保护 server 不去访问不受支持的特性或数据。
