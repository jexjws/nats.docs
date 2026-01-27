# NATS 2.10

本指南面向正在从 NATS 2.9.x 升级的现有 NATS 用户。内容以摘要形式呈现，并提供指向具体文档页面的链接，便于你进一步看每个特性或改进的细节。

## 升级注意事项

### Client 版本

虽然现有的 client 版本都可以继续使用，但较新的 client 会暴露额外的选项，以便利用新功能。完整支持 2.10.0 的最低 client 版本如下：

* CLI - [v0.1.0](https://github.com/nats-io/natscli/releases/tag/v0.1.0)
* nats.go - [v1.30.0](https://github.com/nats-io/nats.go/releases/tag/v1.30.0)
* nats.rs - [v0.32.0](https://github.com/nats-io/nats.rs/releases/tag/async-nats%2Fv0.32.0)
* nats.deno - [v1.17.0](https://github.com/nats-io/nats.deno/releases/tag/v1.17.0)
* nats.js - [v2.17.0](https://github.com/nats-io/nats.js/releases/tag/v2.17.0)
* nats.ws - [v1.18.0](https://github.com/nats-io/nats.ws/releases/tag/v1.18.0)
* nats.java - [v2.17.0](https://github.com/nats-io/nats.java/releases/tag/2.17.0)
* nats.net - [v1.1.0](https://github.com/nats-io/nats.net/releases/tag/1.1.0)
* nats.net.v2 - 即将发布！
* nats.py - 即将发布！
* nats.c - 即将发布！

### Helm charts

* k8s/nats - [v1.1.0](https://github.com/nats-io/k8s/releases/tag/nats-1.1.0)
* k8s/nack - [v0.24.0](https://github.com/nats-io/k8s/releases/tag/nack-0.24.0)

### 降级警告

对 NATS 这类关键基础设施而言，“零停机升级”是基本要求。尽管最佳实践是：在你的具体工作负载上充分测试新版本，但现实中仍会出现线上升级后又决定回滚降级的情况。通常不建议这样做——对大多数基础设施和数据系统而言，降级往往弊大于利。

下面列出若必须降级时需要重点关注的事项。

#### 存储格式变更

2.10.0 带来了磁盘存储格式的变更，并带来显著的性能提升。但该格式与旧版 NATS Server 不兼容。

如果你把一个已有 stream 数据的 server 升级到 2.10.0（磁盘上已存在数据），随后又降级，那么旧版 server 将无法识别新格式的 stream 数据。

考虑到用户可能确实需要降级，2.9.x 系列发布了一个“对新存储格式关键变化有认知”的特殊版本，使其能够正常启动。

结论是：如果降级是唯一选择，则必须降级到 2.9.22 或更高版本，以确保可以正确处理存储格式变更。

#### Stream 与 Consumer 的配置项

2.10 引入了一些新的 stream/consumer 配置项。若发生降级，旧版 server 并不了解这些字段，可能会带来问题。例如：

* 多过滤（multi-filter）consumer：降级后可能不再应用任何过滤，因为新字段是一个列表而不是单个字符串。
* stream 上的 subject transform：降级后可能不会生效，因为旧版 server 不认识该功能。
* stream 压缩（compression）：如果启用了压缩再降级，这些 stream 可能无法加载，因为旧版 server 不理解所使用的压缩方式。

## 功能

### 平台

* 实验性支持 [IBM z/OS](../running-a-nats-service/installation.md#supported-operating-systems-and-architectures)
* 实验性支持 [NetBSD](../running-a-nats-service/installation.md#supported-operating-systems-and-architectures)

### Reload

* 现在可以由 system account 中认证过的 client，向 [`$SYS.REQ.SERVER.<server-id>.RELOAD`](../running-a-nats-service/configuration/#configuration-reloading) 发送消息来触发 server reload。

### JetStream

* 新增 [`sync_interval` server 配置项](../running-a-nats-service/configuration/#jetstream)，用于修改 stream 数据写盘时的默认 sync 间隔，也可以配置为每次写入都立即 flush。只有当你需要调整“持久性保证（durability guarantees）”时，这个选项才与您相关。

### Subject mapping

* Subject mapping 现在支持 [cluster-scoped](../nats-concepts/subject_mapping.md#cluster-scoped-mappings) 与权重（weighted），从而可以按 cluster 设定不同的 mapping 或权重。
* 对“subject mapping/transform 必须使用所有 wildcard token”的要求放宽了。这可用于配置级或 account 级 subject mapping、stream subject transform、stream republishing；但不适用于与 stream 及 service 的跨账号 import/export 相关联的 subject mapping。

### Streams

* 新增 [`subject_transform` 字段](../nats-concepts/jetstream/streams.md#subjecttransforms)，支持按 stream 进行 subject transform。适用于标准 stream、mirror 以及 sourced stream。
* stream 配置新增 [`metadata` 字段](../nats-concepts/jetstream/streams.md#configuration)，允许写入任意用户自定义的键值数据，用来替代或补充 `description` 字段。
* stream 配置新增 [`first_seq` 字段](../nats-concepts/jetstream/streams.md#configuration)，允许在创建 stream 时显式设置初始 sequence。
* stream 配置新增 [`compression` 字段](../nats-concepts/jetstream/streams.md#configuration)，支持 file-based stream 的磁盘压缩。
* 允许在 stream 创建后编辑 [`republish` 配置项](../nats-concepts/jetstream/streams.md#republish)。
* republish 的消息现在会包含 [`Nats-Time-Stamp` header](../nats-concepts/jetstream/headers.md#republish)，其值为原始消息的时间戳。
* stream info 响应新增 `ts` 字段，表示快照生成时的 server 时间，用于基于本地时钟进行时间计算。
* 在 mirror 或 source 配置中，可以添加一个 subject-transform 数组（subject filter + subject transform destination）；但不能与单一 subject filter/subject transform destination 字段同时使用。
* 配置了 `sources` 的 stream 可以在使用不同 filter+transform 选项时，多次从同一个 source stream 进行 sourcing，从而允许某些消息被 source 多次。

### Consumers

* 新增 [`filter_subjects` 字段](../nats-concepts/jetstream/consumers.md#filtersubjects)，支持对多个互不相交的 subject 做 server-side 过滤，而不再仅限一个。
* consumer 配置新增 [`metadata` 字段](../nats-concepts/jetstream/consumers.md#configuration)，允许写入任意用户自定义键值数据，用来替代或补充 `description` 字段。
* consumer info 响应新增 `ts` 字段，表示快照生成时的 server 时间，用于在不依赖本地时钟的情况下进行时间计算。

### Key-value

* key-value 配置新增 [`metadata` 字段](../nats-concepts/jetstream/key-value-store.md#configuration)，允许写入任意用户自定义键值数据，用来替代或补充 `description` 字段。
* bucket 现在可以被配置为 mirror，或从其它 bucket sourcing。

### Object store

* object store 配置新增 [`metadata` 字段](../nats-concepts/jetstream/object-store.md#configuration)，允许写入任意用户自定义键值数据，用来替代或补充 `description` 字段。

### Authn/Authz

* 新增可插拔的 server 扩展（称为 [auth callout](../running-a-nats-service/configuration/securing_nats/auth_callout.md)），用于把认证检查委托给你自带（BYO）的提供方，并且（可选）动态声明已认证用户的权限。

### Monitoring

* [`/varz`](../running-a-nats-service/nats_admin/monitoring/#general-information) 与 [`/jsz`](../running-a-nats-service/nats_admin/monitoring/#jetstream-information) HTTP endpoint 响应新增 `unique_tag` 字段，对应 server 配置中的 `unique_tag`。
* [`/varz`](../running-a-nats-service/nats_admin/monitoring/#general-information) HTTP endpoint 响应新增 `slow_consumer_stats` 字段，提供 clients、routes、gateways、leafnodes 的慢消费者计数。
* [`/jsz`](../running-a-nats-service/nats_admin/monitoring/#jetstream-information) HTTP endpoint 新增 `raft=1` query 参数，会在响应中追加 `stream_raft_group` 与 `consumer_raft_groups` 字段。
* [`$SYS.REQ.SERVER.PING.STATZ`](../running-a-nats-service/configuration/sys_accounts/sys_accounts.md#usdsys.req.server.less-than-id-greater-than.statsz-requesting-server-stats-summary) endpoint 响应新增 `num_subscriptions` 字段。
* 新增 [`$SYS.REQ.SERVER.PING.IDZ`](../running-a-nats-service/configuration/sys_accounts/sys_accounts.md#usdsys.req.server.ping.idz-discovering-servers) 的 system account responder，会返回 client 当前连接的 server 信息。
* 新增 [`$SYS.REQ.SERVER.PING.PROFILEZ`](../running-a-nats-service/configuration/sys_accounts/sys_accounts.md#usdsys.req.server.less-than-id-greater-than.profilez-request-profiling-information) 的 system account responder，即使未在 server 配置中启用 profiling port 也能工作。
* 新增 [`$SYS.REQ.USER.INFO`](../running-a-nats-service/configuration/sys_accounts/sys_accounts.md#usdsys.req.user.info-request-connected-user-information) 的 user account responder，允许已连接用户查询其所在 account 以及拥有的权限。

### MQTT

* 新增对 [QoS2](../running-a-nats-service/configuration/mqtt/) 的支持。另可查看新的 [MQTT 实现细节](https://github.com/nats-io/nats-server/blob/main/server/README-MQTT.md) 概览。

### Clustering

* 在定义 server 之间的 routes 时，引入了一些优化，包括 server 之间的 TCP 连接池、可选的按 account 绑定连接、可选的流量压缩等。更多细节请查看 [v2 routes](../running-a-nats-service/configuration/clustering/v2_routes.md)。

### Leafnodes

* 新增 [`handshake_first` 配置项](../running-a-nats-service/configuration/leafnodes/#tls-first-handshake)，支持 leafnode 连接的 TLS-first 握手。

### Windows

* 新增 [`NATS_STARTUP_DELAY` 环境变量](../running-a-nats-service/running/windows_srv.md#nats_startup_delay-environment-variable)，允许修改 server 默认 10 秒的启动延迟。

## 改进

### Reload

* [`nats-server --signal` 命令](../running-a-nats-service/nats_admin/signals.md#multiple-processes) 现在支持对 `<pid>` 参数使用 glob 表达式，以匹配主机上运行的 `nats-server` 实例子集。

### Streams

* 在 2.10 之前，对 mirror 设置 [`republish` 配置](../nats-concepts/jetstream/streams.md#republish) 会报错；对 sourcing stream，则只有那些“正在被存储且匹配已配置 `subjects`”的消息会被 republish。现在行为已放宽：mirror 允许 republish；sourcing stream 上则会包含全部消息。

### Consumers

* fetch 响应新增一个 header，告知 client：本次 fetch 已被满足，无需依赖 heartbeats 来判断。它可以避免某些情况下 client 发出可能超限的 fetch 请求，或产生多余的 pending fetch。

### Leafnodes

* 以前：如果 leafnode 配置了两个或以上 remotes 且绑定到同一个 hub account，会被拒绝。现在限制已放宽，因为每个 remote 可以绑定到不同的本地 account。

### MQTT

* 以前 MQTT topic 中不支持点号 `.`，现在支持了！详情可查看 [topic-subject 转换表](../running-a-nats-service/configuration/mqtt/)。
