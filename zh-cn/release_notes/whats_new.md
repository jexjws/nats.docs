# 新增内容（What's New!）

NATS.io 团队持续为你带来能提升 NATS 使用体验的新特性。下面汇总了 NATS 的新增实现。

最新补丁版本（patch release）的发布说明请参见 [GitHub Releases](https://github.com/nats-io/nats-server/releases)。

## 未来版本路线图

参见 [https://nats.io/about/#roadmap](https://nats.io/about/#roadmap)

## Server release v2.12.0

请查看：

- [升级指南](./whats_new_212.md)
- [发布说明](https://github.com/nats-io/nats-server/releases/tag/v2.12.0)

## Server release v2.11.0

请查看：

- [升级指南](./whats_new_211.md)
- [发布说明](https://github.com/nats-io/nats-server/releases/tag/v2.11.0)

## Server release v2.10.0

请查看：

- [升级指南](./whats_new_210.md)
- [播客 EP06：NATS.io 2.10 发布的历程与特性](https://youtu.be/9J4pRzHSc2k)
- [发布说明](https://github.com/nats-io/nats-server/releases/tag/v2.10.0)

## Server release v2.9.0

请查看博客中的[发布公告](https://nats.io/blog/nats-server-29-release/)以及 server 仓库中的[详细发布说明](https://github.com/nats-io/nats-server/releases/tag/v2.9.0)。

## Server release v2.8.0

### LeafNode

在 `leafnodes{}` 中新增对 `min_version` 的支持，可拒绝低于该版本的 servers。注意：该功能仅对 v2.8.0 及以上版本的 servers 生效。

### Monitoring

- 在监控落地页中显示 server 版本。
- 当发生失败时向 `/healthz` endpoint 记录日志。
- 在 `/varz` endpoint 中新增 MQTT 与 Websocket 块。

### JetStream

- 在 `healthz` endpoint 增加 consumer 检查。
- 增加 max stream bytes 检查。
- 支持限制 consumer 的 `MaxAckPending` 值。
- 允许 streams 与 consumers 在 clusters 之间迁移。_该特性被视为 “beta”_。
- 在 `jetstream{}` 配置块中新增 `unique_tag` 选项，避免把同一个 stream 两次放置在同一个可用区。
- `StreamInfo` 响应新增 stream 的 `Alternates` 字段：它们提供 mirrors 的优先级列表，以及 source 与请求来源位置的关系。
- 用确定性的 subject tokens 来做分区映射。

完整发布信息请参见：

- 发布说明 [2.8.0](https://github.com/nats-io/nats-server/releases/tag/v2.8.0)
- 变更列表 [2.7.4...2.8.0](https://github.com/nats-io/nats-server/compare/v2.7.4...v2.8.0)

## Server release v2.7.0

### **Notice for JetStream Users**

（JetStream 用户注意事项）

如果你在使用 LeafNode 的 domains，请参见这条[重要说明](https://github.com/nats-io/nats-server/pull/2693#issuecomment-996212582)。

### Configuration

支持在 server 配置文件中配置 account 限制：`max_connections`、`max_subscriptions`、`max_payload`、`max_leafnodes`。

### JetStream

- Streams 的溢出放置（overflow placement）：当一个 stream 无法放置在请求来源的 cluster 中时，它现在可以放置到距离请求来源最近、且可以放置它的 cluster。
- 支持临时（ephemeral）的 Pull consumers（client libraries 需要更新以支持）。
- 新增 consumer 配置项
  - 对 Pull Consumers：`MaxRequestBatch` 用于限制任意 client 可请求的 batch 大小；`MaxRequestExpires` 用于限制任意 client 可请求的过期时间。
  - 对 ephemeral consumers：`InactiveThreshold` 用于指示 server 清理“超过该时长不活跃”的 ephemeral consumers。
- 支持在 `jetstream{}` 块中用字符串配置 `max_file_store` 与 `max_memory_store`，并带后缀 `K`、`M`、`G`、`T`，例如：`max_file_store: "256M"`。
- 支持 JWT 字段 `MaxBytesRequired`，用于定义每个 account 的资产最大字节数。

### MQTT

支持 websocket 协议。MQTT clients 必须连接到开放的 websocket 端口，并在 URL 路径中添加 `/mqtt`。

### TLS

可在顶层 `tls{}` 配置块中加入 `connection_rate_limit: <每秒连接数>` 来对 client 连接进行限流。

完整发布信息请参见：

- 发布说明 [2.7.0](https://github.com/nats-io/nats-server/releases/tag/v2.7.0)
- 变更列表 [2.6.6...2.7.0](https://github.com/nats-io/nats-server/compare/v2.6.6...v2.7.0)

## Server release v2.6.0

### **Notice for JetStream Users**

（JetStream 用户注意事项）

如果你要从早于 NATS Server v2.4.0 的版本升级，请参见这条重要[说明](https://github.com/nats-io/nats-server/releases/tag/v2.4.0)。

### Notice for MQTT Users

（MQTT 用户注意事项）

如果你要从早于 v2.5.0 的版本升级，请参见这条重要[说明](https://github.com/nats-io/nats-server/releases/tag/v2.5.0)。

### Monitoring

- 在 `/jsz` 与 `/varz` endpoints 中显示 JetStream 的保留内存（reserved）以及带预留的 accounts 的内存使用情况。
- 强化 systemd 服务。

完整发布信息请参见：

- 发布说明 [2.6.0](https://github.com/nats-io/nats-server/releases/tag/v2.6.0)
- 变更列表 [2.5.0...2.6.0](https://github.com/nats-io/nats-server/compare/v2.6.0...v2.5.0)

## Server release v2.5.0

### **Notice for JetStream Users**

如果你要从早于 NATS Server v2.4.0 的版本升级，请参见这条重要[说明](./#notice-for-jetstream-users)。

### MQTT/Monitoring

- 在 `/connz` connections report 与系统事件 CONNECT/DISCONNECT 中新增 `MQTTClient`。支持按 `mqtt_client` 进行筛选。

### MQTT Improvement

- 会话（sessions）现在都存储在同一个 stream 中，而不是每个会话一个 stream，从而降低资源消耗。

### MQTT Update

- 由于上述改进，当 MQTT client 在升级后的 server 版本上第一次连接时，server 会把该用户 account 下所有 `$MQTT_sess_<xxxx>` streams 迁移到新的 `$MQTT_sess` stream。

完整发布信息请参见：

- 发布说明 [2.5.0](https://github.com/nats-io/nats-server/releases/tag/v2.5.0)
- 变更列表 [2.4.0...2.5.0](https://github.com/nats-io/nats-server/compare/v2.4.0...v2.5.0)

## Server release v2.4.0

### Notice for JetStream Users

随着 NATS server 的最新发布，我们修复了与 queue subscriptions 相关的 bug，并限制了一些不理想的行为。
这些行为可能令人困惑，或会在 client 应用出现非预期/未定义行为时引入数据丢失风险。

如果你在 JetStream Push Consumer 上使用 queue subscriptions，或为同一个 consumer 创建了多个 push subscriptions，你可能会受到影响，并需要同时升级 client 与 server。
我们在下文详细说明了不同 client 版本下的行为。

当 NATS Server **早于** v2.4.0，且 client libraries **早于** 下列版本时：NATS C client v3.1.0、Go client v1.12.0、Java client 2.12.0-SNAPSHOT、NATS.js v2.2.0、NATS.ws v1.3.0、NATS.deno v1.2.0、NATS .NET 0.14.0-pre2：

- 可以为同一个 JetStream durable consumer 创建多个“非 queue subscription”的实例。这是不正确的，因为每个实例都会收到同一条消息的副本；ACK 在这种情况下也失去意义，因为第一个 ACK 的实例会阻止其它实例再决定是否/何时 ACK。
- 与上一个问题类似，可以为一个 JetStream consumer 创建很多不同的 queue groups。
- 对 queue subscriptions：如果未提供 consumer 或 durable name，库会创建 ephemeral JetStream consumers，这意味着同一 group 的每个成员都会收到与其它成员相同的消息，这并不是预期行为。
  用户通常以为：2 个成员以 queue group “bar” 订阅 “foo”，会对 stream/consumer 的消息做负载均衡。
- 可以在配置了 heartbeat 和/或 flow control 的 JetStream consumer 上创建 queue subscription。这没有意义，因为 queue members 会随机分配到消息；库会认为 heartbeats 丢失，flow control 也会被破坏。

如果上述 client libraries 没有更新到最新版，但 NATS Server 升级到 v2.4.0：

- 仍然可以为同一个 JetStream durable consumer 创建多个“非 queue subscription”的实例。
  由于检查由库执行（借助 server 在 consumer information 对象中新增加的字段 `PushBound`），所以该错误行为仍可能发生。
- Queue subscriptions 将不会收到任何消息。
  这是因为 server 现在在 consumer 配置中新增了 `DeliverGroup` 字段；旧的 JetStream consumers（以及旧版库）不会设置该字段。
  server 只有在发现“deliver subject 上存在与 deliver group 名称匹配的 queue subscription”时，才会认为有 interest（并开始投递）。
  但由于 JetStream consumer 被认为是非 deliver-group consumer，反而会发生相反情况：server 检测到 deliver subject 上存在 core NATS 的 _queue_ subscription，因此不会触发对 JetStream consumer deliver subject 的投递。

其余两个问题仍然存在，因为相关检查是在更新后的库中完成的。

如果上述 client libraries 更新到最新版，但 NATS Server 仍为早于 v2.4.0 的版本（即最高到 v2.3.4）：

- 仍然可以为同一个 JetStream durable consumer 创建多个“非 queue subscription”的实例。
  因为库从 server 获取到的 JetStream consumer information 中不会有 server 设置的 `PushBound` 布尔值，因此无法提示用户其正在为同一个 consumer 创建多个订阅实例。
- Queue subscriptions 会失败，因为 consumer information 不包含 `DeliverGroup` 字段。
  错误大概率会表现为：用户试图对“非 queue JetStream consumer”创建 queue subscription。
  注意：如果应用为一个尚未创建的 JetStream consumer 创建 queue subscription，该调用仍会成功；但当 consumer 已存在后，再添加新成员或重启应用则会失败。
- 创建 queue subscription 时未指定 consumer/durable 名称，会导致库使用 queue name 作为 durable name。
- 如果 consumer 配置包含 heartbeat 和/或 flow control，尝试创建 queue subscription 会返回错误。

为完整起见，当使用最新 client libraries 且 NATS Server v2.4.0：

- 尝试为同一个 JetStream consumer 启动多个“非 queue subscription”实例，会返回错误：用户试图创建“重复订阅（duplicate subscription）”。
  即该 JetStream consumer 已经存在一个活跃订阅。
  现在只能为“为该 queue group 创建的 JetStream consumer”创建该 queue group。
  `DeliverGroup` 字段将由库设置，或者在外部创建 consumer 时需要提供。
- 创建 queue subscription 时未指定 durable/consumer name，会导致库创建/使用 queue group 作为 JetStream consumer 的 durable name。
- 如果 consumer 配置包含 heartbeat 和/或 flow control，尝试创建 queue subscription 会返回错误。

注意：如果 server v2.4.0 恢复了在 v2.4.0 之前（且使用旧版库）创建的 JetStream consumers，这些 consumers 都不会有 `DeliverGroup`，因此都无法用于 queue subscriptions；它们需要被重建。

### JetStream

- `PubAck` 协议内容增加 Domain 字段
- `ConsumerInfo` 中新增 `PushBound` 布尔值，用于指示某个 push consumer 是否已绑定到一个活跃订阅
- `ConsumerConfig` 中新增 `DeliverGroup` 字符串，用于指定该 consumer 是为哪个 deliver group（或 queue group name）创建
- 当 stream catchup 发生错误时增加 warning 日志

### Monitoring

- 普通 accounts 现在可以访问受限（scoped）的 `connz` 信息

### Misc

- Operator 选项 `resolver_pinned_accounts`：确保用户由某些 accounts 签名

完整发布信息请参见：

- 发布说明 [2.4.0](https://github.com/nats-io/nats-server/releases/tag/v2.4.0)
- 变更列表 [2.3.4...2.4.0](https://github.com/nats-io/nats-server/compare/v2.3.4...v2.4.0)

## Server release v2.3.0

- [OCSP 支持](../running-a-nats-service/configuration/ocsp.md)

### JetStream

- 更丰富的 API 错误：JetStream 错误现在包含一个唯一描述错误的 ErrCode。
- 支持更高级的 Stream purge 请求：可对某个特定 subject 清除全部消息。
- Stream 现在可配置按 subject 的消息数量上限。
- JetStream 静态数据加密（at rest）。

完整发布信息请参见：

- 发布说明 [2.3.0](https://github.com/nats-io/nats-server/releases/tag/v2.3.0)
- 变更列表 [2.2.6...2.3.0](https://github.com/nats-io/nats-server/compare/v2.2.6...v2.3.0)

## Server release v2.2.0

请参见 [NATS 2.2](whats_new_22.md) 的新增特性。

## Server release v2.1.7

### 监控端点可通过 System Services 访问

下表中列出的监控端点可作为 system services 访问，subject pattern 如下：

- `$SYS.REQ.SERVER.<id>.<endpoint-name>`（请求某个 server 的监控 endpoint，对应 endpoint-name）
- `$SYS.REQ.SERVER.PING.<endpoint-name>`（向所有 servers 请求对应监控 endpoint-name，会返回多条消息）

更多信息请参见 [NATS Server Configurations System Events](../running-a-nats-service/configuration/sys_accounts/)。

### 新增 `no_auth_user` 配置

`no_auth_user` 允许你在未提供凭据时引用某个已配置的 user/account。

更多信息与示例请参见 [Securing NATS](../running-a-nats-service/configuration/securing_nats/)。

完整发布信息请参见：

- 发布说明 [2.1.7](https://github.com/nats-io/nats-server/releases/tag/v2.1.7)
- 变更列表 [2.1.6...2.1.7](https://github.com/nats-io/nats-server/compare/v2.1.6...v2.1.7)

## Server release v2.1.6

### Account Resolver 的 TLS 配置

此版本新增对 account resolver 的 TLS 配置能力。

```
resolver_tls {
  cert_file: ...
  key_file: ...
  ca_file: ...
}
```

### 新增 Trace 与 Debug 详细度选项

新增 `trace_verbose` 以及命令行参数 `-VV` 与 `-DVV`。
参见 [NATS Logging Configuration](../running-a-nats-service/configuration/logging.md#configuring-logging)

### 监控端点中的订阅详情

我们新增了在监控端点 `/routez` 与 `/connz` 中包含订阅详情的选项。
例如 `/connz?subs=detail` 将不只返回订阅的 subjects，还会返回 queue 名称（若适用）以及一些其它细节。

- 发布说明 [2.1.6](https://github.com/nats-io/nats-server/releases/tag/v2.1.6)
- 变更列表 [2.1.4...2.1.6](https://github.com/nats-io/nats-server/compare/v2.1.4...v2.1.6)

## Server release v2.1.4

### 日志轮转（Log Rotation）

NATS 引入 `logfile_size_limit`：当日志文件大小超过配置的上限时（以字节为单位），会自动轮转日志。
你也可以用带单位的大小值，例如 MB、GB 等。
备份文件名与原始日志文件名相同，但会追加后缀 `.yyyy.mm.dd.hh.mm.ss.micros`。
更多信息参见 [NATS Server Configuration section](../running-a-nats-service/configuration/logging.md) 中的 Configuring Logging。

- 发布说明 [2.1.4](https://github.com/nats-io/nats-server/releases/tag/v2.1.4)
- 变更列表 [2.1.2...2.1.4](https://github.com/nats-io/nats-server/compare/v2.1.2...v2.1.4)

## Server release v2.1.2

### Queue 权限（Queue Permissions）

Queue Permissions 允许你表达对 queue groups 的授权。
由于 queue groups 是实现水平可扩展微服务的关键机制，因此控制“谁可以加入某个特定 queue group”对整体安全模型很重要。
原始 PR - [https://github.com/nats-io/nats-server/pull/1143](https://github.com/nats-io/nats-server/pull/1143)

关于 Queue Permissions 的更多信息请参见 [Developing with NATS](../using-nats/developing-with-nats/receiving/queues.md) 章节。

## Server release v2.1.0

### Service 延迟跟踪（Service Latency Tracking）

随着 services 与 service mesh 功能的重要性不断提高，我们一直在探索如何让在 NATS.io 上运行可规模化服务变得更好。
我们关注的一个方向是可观测性。

在 pub/sub 系统中，万物天然可观测；但我们意识到，它并没有想象中那么简单。
我们希望能够在不修改应用的情况下，为任意 service 透明地增加 service latency tracking。

我们也意识到：像 NATS.io 这样支持全球系统的场景，需要的不止一个指标。
因此我们允许在导出的 service 上附加任意采样率，并为所有采集到的 metrics 指定一个投递 subject。

我们采集的 metrics 同时包含：请求方视角的延迟、响应方视角的延迟，以及 NATS 子系统本身的延迟；即使请求方与响应方位于世界不同区域、连接到 supercluster 中不同 servers，这些 metrics 也同样适用。

- 发布说明 [2.1.0](https://github.com/nats-io/nats-server/releases/tag/v2.1.0)
- 变更列表 [2.0.4...2.1.0](https://github.com/nats-io/nats-server/compare/v2.0.4...v2.1.0)

## Server release v2.0.4

### 仅响应权限（Response Only Permissions）

对 services 来说，用于“响应请求”的授权通常包含对 `_INBOX.>` 的 wildcard，以及在 supercluster 中可能还包含对 `$GR.>` 的 wildcard，以便发送响应。
我们真正想要的是：允许 service responder 只对“它收到的 reply subject”进行响应。

### 响应类型（Response Types）

导出的 Services 最初只绑定到单一响应。
我们为 service response 增加了类型，并支持 singletons（默认）、streams 和 chunked。
Stream responses 表示多条响应消息；chunked 表示一个响应但可能需要拆分为多条消息发送。

- 发布说明 [2.0.4](https://github.com/nats-io/nats-server/releases/tag/v2.0.4)
- 变更列表 [2.0.2...2.0.4](https://github.com/nats-io/nats-server/compare/v2.0.2...v2.0.4)
