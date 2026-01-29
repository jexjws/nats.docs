# 操作指南与快速入门

## 概述

这些示例的主要受众是 Dev-Ops、运维人员和架构师。我们将展示如何配置 NATS 的各项功能，从简单的本地服务器到带有叶节点的复制超级集群以及分布式认证。

多些冗余也无妨。这里的不少例子是从别处‘搬运’来的，我们对此直认不讳。 :)

我们通常使用 [NATS 命令行界面](../using-nats/nats-tools/nats_cli/README.md)（NATS CLI），您可在此处[下载](https://github.com/nats-io/natscli/releases)。

​NATS CLI 是一个基于 Golang API 构建的独立工具，其中并没有什么“独家秘籍”。凡是能通过 CLI 完成的操作，也都能通过[客户端 API](#编程示例与客户端-API) 实现（偶尔可能需要监听一些特定的“魔法”主题）。

示例大致分为以下几类：

* **Basic** - **基础** - 专注于单一功能或任务 - 例如，带有流的发布/订阅
* **Common** - **常见** - 常见的配置任务或使用场景 - 例如，设置一个具有常见保留和交付 SLA 的流
* **Complex** - **复杂** - 需要具备一定 NATS 知识的复杂配置 - 例如，设置一个包含叶节点、复制（容错）机制的集群
* **Exhaustive** - **详尽** - 仅作示例——例如：展示一个流的所有保留与限制选项

最后：借助 LLMs（大型语言模型）学习示例。提供详尽、完整的示例可以提高 ChatGPT 回复的质量。就这一目的而言，内容比结构更重要。

## 编程示例与客户端 API

[NATS by example.](https://natsbyexample.com/) 收集了各种语言的代码示例。

[可用的客户端 API 们](https://docs.nats.io/using-nats/developer)

## 开始之前

示例尽量手把手，并假设读者没有太多相关知识。要开始使用，您需要安装 [nats-server](https://github.com/nats-io/nats-server/releases) 和 [nats-cli](https://github.com/nats-io/natscli/releases)。

### 服务器

`nats-server` 是一个单一可执行文件，附带一个单一配置文件。我们建议从本地设置开始以便测试。我们提供了 ZIP 压缩文件。请暂时不要急着部署到云端。

运行 NATS 服务器时无需配置文件，默认监听端口 4222、不会启用 JetStream。

```shell
nats-server 
```

如果您想了解内部工作原理，可以启用调试、跟踪功能（不适合性能测试）。

```shell
nats-server -DV
```

### CLI

`nats-cli` 是用 Golang 编写的单个可执行文件，使用起来挺直观的，命令和选项按层级组织。

```shell
nats 

用法: nats [<flags>] <command> [<args> ...]

NATS 工具

用于 NATS Server 和 JetStream 的管理。

使用 'nats cheat' 查看命令速查表

Commands:
  account    帐户信息和状态
  bench      基准测试工具
  consumer   JetStream 消费者管理
  context    管理 NATS 配置上下文
  errors     错误代码文档
  events     显示通告与事件
  kv         与基于 JetStream 的键值存储交互
  latency    在两个 NATS 服务器之间执行延迟测试
  micro      微服务发现与管理
  object     与 JetStream 对象存储交互
  publish    通用数据发布工具
  request    通用请求-响应请求工具
  reply      通用服务响应工具
  rtt        计算到 NATS 服务器的往返时间
  schema     模式工具
  server     服务器信息
  stream     JetStream 流管理
  subscribe  通用订阅客户端
```

要了解发布操作，请使用以下命令：

```shell
nats publish 

用法: nats publish [<flags>] <subject> [<body>]

通用数据发布工具

消息的 Body 和 Header 值可以使用 Go 模板来创建唯一消息。

  nats pub test --count 10 "Message {{Count}} @ {{Time}}"

发送多个包含长度为 10 到 100 的随机字符串的消息：

  nats pub test --count 10 "Message {{Count}}: {{ Random 10 100 }}"

可用的模板函数有：

  Count            消息编号
  TimeStamp        RFC3339 格式的当前时间
  Unix             自 1970 年起的秒数（UTC）
  UnixNano         自 1970 年起的纳秒数（UTC）
  Time             当前时间
  ID               唯一 ID
  Random(min, max) 生成长度至少为 min、最多为 max 的随机字符串

Args:
  <subject>  要发布到的主题
  [<body>]   消息体
```