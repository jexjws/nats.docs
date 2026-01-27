# 构建本书（Building the Book）

在做任何事情之前，请先安装 gitbook 的旧版命令行工具：

```bash
npm install -g gitbook-cli
```

仓库里有一个 `Makefile`，可以更方便地构建本书。要在本地构建并运行文档站点的 http 服务器：

```bash
make && make serve
...
info: >> generation finished with success in 45.3s ! 

Starting server ...
Serving book on http://localhost:4000
```

Gitbook 的各个文档条目位于：https://github.com/GitbookIO/gitbook/tree/6efbb70c3298a9106cb2083648624fd1b7af51c0/docs。所有链接都指向新站点，所以你需要手动四处点点看。

构建过程使用了 https://github.com/Bandwidth/gitbook-plugin-include-html 来直接 include HTML（用于代码示例），同时也使用了 prism 插件 https://github.com/gaearon/gitbook-plugin-prism 来处理代码高亮。

如果你不使用默认主题，代码高亮的 CSS 有时会被弄乱，这个问题将来需要再处理。我们也在使用 https://github.com/poojan/gitbook-plugin-toggle-chapters；曾尝试过 https://github.com/rtCamp/gitbook-plugin-collapsible-menu，但它会把 HTML 弄坏。

开发示例用到的图标来自：https://cdn.materialdesignicons.com/3.6.95/。

构建 examples：

```bash
go run tools/examplecompiler/main.go -o developer/examples -r tools/examplecompiler/example_repos.json -t tools/examplecompiler/example_template.tmp
```

或者直接用 makefile：执行 `make` 会下载 gitbook 插件、构建示例 HTML 并构建整本书。

`make serve` 只会启动静态文件服务，不会做其它准备工作。
