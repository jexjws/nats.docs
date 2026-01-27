# NATS 2.0

NATS 2.0 是自 server 最初代码库发布以来最大的一次特性发布。
NATS 2.0 的目标是引入一种新的 NATS 思维方式：把 NATS 作为共享的基础设施工具（shared utility），通过分布式安全、多租户、更大规模的网络以及安全的数据共享来解决规模化问题。

## 背景与动机（Rationale）

NATS 2.0 旨在解决大规模分布式计算中的关键问题。

要在遵守政策与合规要求的同时，把端到端（或端到边缘，end-to-edge）的身份管理与数据共享整合起来，本身就非常困难。
现有分布式系统随着规模扩大，运维复杂度会显著上升。
问题常出现在服务发现、连通性、吞吐扩展、应用接入与更新等方面。
灾备也很困难，尤其当系统按技术栈而非业务需求被划分为各自为政的“孤岛”时。
随着复杂度上升，系统在时间与金钱上的运维成本都会变得昂贵。
系统也会变得脆弱：部署服务与应用更困难，阻碍创新、拉长价值实现时间，并提高总体拥有成本（TCO）。

因此我们决定：

* **降低总体拥有成本（TCO）：** 用户希望其分布式系统的 TCO 更低。
  我们通过一种易用的技术来实现：它能以简单配置在全球范围运行，并具备可靠、云原生的架构。

* **缩短价值实现时间（Time to Value）：** 系统规模越大，_time to value_ 越长。
  运维团队因担心触碰复杂而脆弱的系统带来风险，往往抗拒变更。
  提供隔离上下文可以缓解这一点。

* **支持可管理的大规模部署：** 不再由软件定义数据孤岛，而是通过软件来轻松管理，从而精准满足业务需求。
  我们希望提供易于配置的灾难恢复能力。

* **去中心化安全：** 提供端到端的安全能力，使组织能够自我管理，从而更容易支持海量 endpoints。

为实现这些目标，我们新增了大量对现有 client 完全透明的特性，并保持 100% 向后兼容。

## Accounts

Account 是安全隔离的通信上下文，可在一个 NATS 部署中实现多租户。
Account 让用户能够把“技术维度”与“业务驱动的使用场景”分离：数据孤岛是由设计决定，而不是软件限制导致。
当 client 连接时，会指定一个 account；若未指定，则默认使用全局 account 进行认证。

在实际系统中，总有一些服务需要在 account 之外共享数据。
通过安全的 services 和 streams，可以在 accounts 之间安全共享数据。
只有在 account 所有者相互同意的情况下，数据流才被允许；并且导入（import）account 对自身 subject 空间拥有完全控制权。

这意味着在一个 account 内可以设置限制，并且可以放心使用 subjects，不必担心与其它组织或团队产生冲突。
开发团队可以随意选择 subjects 而不影响系统其它部分；并且只开放（export/import）他们真正需要的 services 与 streams。

Accounts 易用、安全且成本友好。
你只需要管理一套 NATS 部署，但组织与开发团队可以以更高自主性进行自我管理，从而用更敏捷的开发实践缩短价值实现时间。

### Services 与 Streams

Services 与 streams 是在 accounts 之间共享消息的机制。

你可以把 service 理解为进入某个 account 的 RPC endpoint。
在该 account 内部可能有多个微服务协作来处理请求，但对 account 外部来说，只暴露了一个 subject。

**Service** 定义用于共享一个 endpoint：

* Export 一个 service，允许其它 accounts 导入
* Import 一个 service，使请求能安全且无缝地发送到另一个 account

用例涵盖大多数应用：任何接收请求并返回响应的场景。

**Stream** 定义用于让数据在 accounts 之间持续流动：

* Export 一个 stream，用于 egress
* Import 一个 stream，用于 ingress

用例包括可观测性（Observability）、指标（Metrics）与数据分析（Data analytics），以及任何读取数据流的应用或 endpoint。

需要注意的是，services 与 streams 不需要 **任何** client 侧配置或 API 变更。
Service 甚至可以在 accounts 之间迁移，对终端 client 完全透明。

### System Accounts

System account 会以既定的 subject 模式发布系统消息。
这些是 NATS 内部的系统消息，可能对运维人员有用。

由 server 发起的事件与数据包括：

* Client 连接事件
* Account 连接状态
* 认证错误
* Leaf node 连接事件
* Server 统计摘要

具备合适权限的工具与 client 还可以请求：

* Service 统计
* Server 发现与 metrics

当某个 account 发生变更时，account servers 也会发布消息。

基于这些信息与系统元数据，你可以构建有用的监控与异常检测工具。

## 全球化部署（Global Deployments）

NATS 2.0 支持全球化部署，使全球拓扑在优化 WAN 的同时延伸到边缘或设备。

### 自愈（Self Healing）

虽然自愈特性在 NATS 1.X 中就已存在，但我们确保它们在全球部署场景下仍然有效，包括：

* Client 与 server 连接自动重连
* 自动发现（Auto-Discovery）：servers 会与彼此交换拓扑变化，并与 clients 实时同步，零配置变更、零停机，对 clients 完全透明。
  Clients 可以 failover 到最初未配置的 servers。
* NATS server cluster 会根据新增/移除的 servers 动态调整，从而支持无缝滚动升级与弹性扩缩容。

### 超级集群（Superclusters）

从概念上讲，supercluster 是“由多个 NATS clusters 组成的 cluster”。
通过 supercluster 可以部署真正全球化的 NATS 网络。
Supercluster 使用一种新颖的基于 spline 的技术与独特的拓扑方法，保持单跳语义（one hop semantics），并通过基于兴趣图裁剪（interest graph pruning）的乐观发送（optimistic sends）来优化 WAN 流量。
Supercluster 为地理分布式 queue subscribers 提供透明、智能的支持。

### 灾难恢复（Disaster Recovery）

Supercluster 天生支持灾难恢复。
对于地理分布式的 queue subscribers，会优先选择本地 clients；然后使用 RTT 在 supercluster 中找到包含匹配 queue subscriber 的最低延迟 NATS cluster。

这意味着什么？

假设你在美国东海岸（US-EAST）有一组负载均衡服务，在欧洲（EU-WEST）也有一组；并且有一个 supercluster：US-EAST 的一个 NATS cluster 连接到 EU-WEST 的一个 NATS cluster。
美国的 clients 会连接到 US-EAST 的 cluster，并由连接到该 cluster 的服务处理。
欧洲的 clients 会自动使用连接到 EU-WEST 的服务。
如果 US-EAST 的服务断开连接，US-EAST 的 clients 会开始使用 EU-WEST 的服务。

一旦 US-EAST 的服务重新连接到 US-EAST，它们会立刻恢复为 US-EAST clients 提供服务，因为它们对该 NATS cluster 来说是本地的。
这一切都是自动发生的，并且对 client 完全透明。
无需在 NATS server 中做额外配置。

这就是 **零配置灾难恢复（zero configuration disaster recovery）**。

### Leaf Nodes

Leaf node 是以特殊配置运行的 NATS server，可用于 hub-and-spoke 拓扑，从而把 supercluster 延伸出去。

Leaf node 也可以桥接不同的安全域，例如 IoT、移动端、Web。
它们非常适合边缘计算、IoT hubs，或需要接入全球 NATS 部署的数据中心。
本地应用如果只通过 loopback 接口通信，并依赖物理 VM 或容器隔离安全，也同样可以利用 leaf nodes。

Leaf nodes：

* 透明且安全地绑定到远端 NATS account
* 安全地把指定的本地数据桥接到更大的 NATS 部署
* 对 clients 100% 透明——client 仍然保持简单、轻量且易于开发
* 允许本地继续使用自己的安全方案，同时在全局使用新的 NATS 安全特性
* 可在本地 NATS 部署与外部 NATS cluster/supercluster 之间构建 DMZ

## 去中心化安全（Decentralized Security）

### Operators、Accounts 与 Users

NATS 2.0 的安全体系由 Operators、Accounts 与 Users 三层定义构成。

* **Operator** 提供系统信任根（root of trust），可代表公司或企业。

  * 创建 **Accounts** 供 account 管理员使用。
    一个 account 可以代表组织、业务单元或服务形态；它在 NATS 部署中提供安全上下文。
    例如 IT 监控团队、一组微服务，或一个区域性的 IoT 部署。
    Account 的创建通常由中心化团队管理。

* **Accounts** 定义限制，并可安全地暴露 services 与 streams。
  * Account 管理者创建具备权限的 **Users**
* **Users** 拥有特定的凭据与权限。

### 信任链（Trust Chain）

PKI（NKeys 编码的 [Ed25519](https://ed25519.cr.yp.to/)）与签名 JWT 共同构成 Operators、Accounts 与 Users 的层级关系，形成可扩展且灵活的分布式安全机制。

* **Operators** 由自签名 JWT 表示，也是 server 配置中唯一需要配置的内容。
  该 JWT 通常由离线保存的 master key 签名。
  JWT 将包含有效的签名密钥；如果需要吊销，可通过 master key 更新该 JWT。

  * Operator 会使用不同的签名密钥签发 **Account** JWT。
  * **Accounts** 再使用不同的签名密钥签发 **User** JWT。

* Clients 或 leaf nodes 在连接时会提供 **User** 凭据以及一个已签名的 nonce。
  * Server 会通过 resolvers 获取 JWT 并验证 client 的信任链。

这使得权限、认证与限制的变更可以快速生效，从而构建安全的多租户 NATS 系统。
