# NATS 2.2

NATS 2.2 是自 2.0 以来最大的一次特性发布。2.2 版本以 JetStream 的形式带来了高度可扩展、高性能、可靠且易用的下一代流式能力；支持通过 WebSockets 进行远程访问；简化了 NATS 账号管理；提供原生 MQTT 支持；并进一步推动 NATS 朝着“为我们所处的超连接世界安全地普及 streams 与 services”的目标前进。

## 下一代流式（Next Generation Streaming）

JetStream 是 NATS 的下一代流式平台，具备高韧性（resilient）、高可用（available）且易于使用。我们花了很长时间倾听社区、总结经验、理解当下需求并思考未来。JetStream 正是为满足这些需求而构建。

JetStream：

* 易于部署与管理，并内置于 NATS server
* 简化并加速开发
* 支持 wildcard subjects
* 支持至少一次投递，并在一个窗口内提供“恰好一次”语义
* 运行时可水平扩展且不中断
* 通过 streams 持久化数据，通过 consumers 投递或回放
* 支持在同一 stream 上以多种模式消费数据
* 消费消息同时支持 push 与 pull 模式
* 具备 account 感知
* 安全粒度细，可按 stream、按 consumer、按功能（function）细分

从 [JetStream](../nats-concepts/jetstream/) 开始上手。

## 安全与简化的账号管理

账号管理变得更简单了。该版本的 NATS 内置账号管理系统：在不使用 memory account resolver 的情况下，不再需要额外搭建 account manager。
通过自动生成默认 system account、并支持预加载 accounts，只要在你的部署中启用一组 servers 作为 account resolvers 或 account resolver caches，它们就能处理通过 NATS 的 nsc 工具提交给系统的公开账号信息。
几分钟内即可完成企业级账号管理系统的搭建。

### CIDR 段的账号限制

通过为用户指定 CIDR 段限制，可以施加策略来限制来自某个 IP 范围/集合的 client 连接。
这能作为用户凭据之上的又一层安全措施，进一步保护分布式系统。
确保应用只能从特定云环境、企业网络、地理位置、虚拟或物理网络中连接。

### 基于时间的账号限制

现在可以对用户设置 [一天中允许连接的时间段](../using-nats/nats-tools/nsc/basics.md#user-authorization)。
例如，只允许某些用户或应用在指定工作时间访问系统；或在业务高峰期限制批处理驱动的后台应用接入，以免在错误时间运行影响系统。

### 默认用户权限

现在你可以在一个 account 内指定 [默认用户权限](../running-a-nats-service/configuration/securing_nats/authorization.md#examples)。
这能显著减少策略配置的工作量，降低权限配置出错概率，并简化用户凭据的发放流程。

## WebSockets

通过 [WebSockets](../running-a-nats-service/configuration/websocket/) 将移动端与 Web 应用连接到任意 NATS server。
WebSocket 更易穿透防火墙和负载均衡器，使 NATS 部署更灵活，也更容易与边缘与终端进行通信。
目前在 NATS server leaf nodes、nats.ts、nats.deno 和 nats.js clients 中得到支持。

## 原生 MQTT 支持

借助 [Adaptive Edge 架构](https://nats.io/blog/synadia-adaptive-edge/) 以及 NATS 将云部署扩展到边缘的能力，我们可以更自然地利用在 IoT 部署上的既有投入。
设备升级与大规模边缘部署成本很高。我们的目标是赋能超连接世界，因此我们在 NATS Server 中直接加入对 [MQTT 3.1.1](../running-a-nats-service/configuration/mqtt/) 的一等支持。

你可以通过 MQTT 3.1.1 将现有 IoT 部署无缝整合到云原生的 NATS 部署中。
增加一个启用 MQTT 的 leaf node，即可让你的 MQTT 应用与设备在 NATS 部署中即时收发消息：无论该部署是在边缘、单云、多云、本地机房，或这些方式的任意组合。

## 构建更好的系统

我们新增了多项特性，帮助你以更高的韧性、更安全、更简单的方式构建可规模化的系统。

### 消息头（Message Headers）

我们新增了可选的 headers（遵循开发者熟悉的 HTTP 语义）。headers 会带来额外开销，这也是我们长期以来不愿加入它的原因。
但通过对开发者透明的内部协议消息，我们在支持 headers 的同时，依然保持了 NATS 对“简单消息”的超快处理能力。
在不触碰 payload 的情况下，headers 允许你添加应用特定的元数据，例如压缩或加密相关信息。
我们也提供了 NATS 特定的 headers，用于 JetStream 及其它特性。

### 用 Lame Duck 通知实现无缝维护

当需要下线 server 做维护时，可以把 server 切换到 [Lame Duck Mode](../running-a-nats-service/nats_admin/lame_duck_mode.md)：它不再接受新连接，并在一段时间内逐步驱逐已有连接。
支持该特性的 client 会通知应用：server 已进入此状态并即将关闭，从而让 client 平滑迁移到其它 server 或 cluster，在计划内维护期间更好地保障业务连续性。

### 用 No-Responder 通知更快响应

当服务不可用时，为什么还要等 timeout？当客户端向服务发起 request-reply 请求、且 NATS Server 知道当前没有任何可用服务时，server 会短路该请求。
它会向请求方返回一条“no-responders”协议消息，打破阻塞式 API 调用。
这让应用能立即做出反应，从而在面对应用故障或网络分区时，也能构建更高响应性的系统。

### Subject mapping 与流量整形（Traffic Shaping）

降低新服务上线风险。NATS 现已完整支持金丝雀发布、A/B 测试，以及对数据流进行透明 tee（复制分流）。
NATS Server 允许 accounts 将一个 subject 映射到另一个 subject，既可用于 client 入站，也可用于 service import 调用；并支持为目的地设置权重集合。
你可以把 1% 到 100% 的流量映射到其它 subjects，并通过 server 配置 reload 在运行时变更。
甚至可以人为丢弃一部分流量来做混沌测试。
更多信息见 NATS Server 配置中的 [Configuring Subject Mapping and Traffic Shaping](../running-a-nats-service/configuration/configuring_subject_mapping.md)。

### Account 监控：更有意义的指标

NATS 现在支持 [细粒度监控](../running-a-nats-service/nats_admin/monitoring/#monitoring-nats)，可识别与某个 account 绑定的使用指标。
你可以查看该 account 的消息/字节收发情况，以及各种连接统计。
Account 可以代表任何东西：一组应用、一个团队或组织、一个地理区域，甚至是一种角色。
如果你用 NATS 支撑 SaaS 方案，可以利用 account 维度的指标进行计费。
