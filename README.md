# 欢迎

###### 官方 [NATS](https://nats.io/) 文档 | [中文文档](https://nats-docs-cn.voyage200.top/)

NATS 是一个简单、安全且高性能的开源数据层，适用于云原生应用、物联网消息传递和微服务架构。

我们认为它应该成为你在服务间通信的骨干。无论你使用何种语言、协议或平台，NATS 都是连接服务的最佳方式。

### 概览

- 以每秒百万级消息速率发布和订阅消息（最多一次交付）。
- 支持扇入/扇出传递模式
- 请求/回复
- 支持所有主流语言
- 通过 JetStream 提供持久化
  - 至少一次交付或 **仅一次** 交付
  - 工作队列
  - 流处理
  - 数据复制
  - 数据保留
  - 数据去重
  - 更高阶的数据结构
    - 带有观察器、版本控制与 TTL 的键/值存储
    - 带版本控制的对象存储
- 安全性
  - TLS
  - 基于 JWT 的零信任安全
- 集群
  - 高可用
  - 容错
  - 自动发现
- 支持的协议
  - TCP
  - MQTT
  - WebSockets

所有这些都打包在一个易于部署和管理的单一二进制文件中。没有外部依赖，只需放入可执行文件并添加配置以指向其他 NATS 服务器即可开始使用。事实上，你甚至可以将 NATS 嵌入到你的应用中（针对 Go 用户）。

## 指南

1. 一般来说，我们建议首先尝试使用 [Core NATS](nats-concepts/core-nats/) 来解决你的问题。
2. 如果你需要在服务之间共享状态，请查看 JetStream 中的 [KV](nats-concepts/jetstream/key-value-store/) 或 [对象存储](nats-concepts/jetstream/object-store/obj_store.md)。
3. 当你需要对持久化流进行更底层的访问时，直接使用 [JetStream](nats-concepts/jetstream/) 以实现更高级的消息模式。
4. 学习有关 [部署策略](nats-concepts/adaptive_edge_deployment.md)
5. 使用 [零信任安全](running-a-nats-service/configuration/securing_nats/jwt/) 来保护你的部署

## 贡献

NATS 和本文件均为开源。如果你对这些文档有更新或建议，请 [联系我们](mailto:info@nats.io) 或创建 Pull Request。

## 其他问题？

欢迎在 Slack 与我们交流： [slack.nats.io](https://slack.nats.io)。

来自 NATS 全体维护团队，感谢你对 NATS 的关注！
