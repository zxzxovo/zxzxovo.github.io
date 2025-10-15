# 设置

本教程将逐步引导您构建一个 [Redis] 客户端和服务器。我们将从 Rust 异步编程的基础开始，然后逐步深入。我们将实现 Redis 命令的一个子集，但将全面了解 Tokio。

## Mini-Redis

您将在本教程中构建的项目在 [GitHub 上的 Mini-Redis][mini-redis] 中可用。Mini-Redis 的主要设计目标是学习 Tokio，因此注释非常详细，但这也意味着 Mini-Redis 缺少您在真正的 Redis 库中想要的一些功能。您可以在 [crates.io](https://crates.io/) 上找到生产就绪的 Redis 库。

我们将在教程中直接使用 Mini-Redis。这使我们能够在教程中使用 Mini-Redis 的部分功能，然后在教程的后面部分实现它们。

## 获取帮助

在任何时候，如果您遇到困难，您总是可以在 [Discord] 或 [GitHub 讨论][disc] 上获得帮助。不要担心询问"初学者"问题。我们都是从某个地方开始的，很乐意提供帮助。

[discord]: https://discord.gg/tokio
[disc]: https://github.com/tokio-rs/tokio/discussions

## 前提条件

读者应该已经熟悉 [Rust]。[Rust 书籍][book] 是入门的优秀资源。

虽然不是必需的，但使用 [Rust 标准库][std] 或其他语言编写网络代码的一些经验会很有帮助。

不需要 Redis 的预先知识。

[rust]: https://rust-lang.org
[book]: https://doc.rust-lang.org/book/
[std]: https://doc.rust-lang.org/std/

### Rust

在开始之前，您应该确保已经安装了 [Rust][install-rust] 工具链并准备就绪。如果您没有安装，最简单的安装方法是使用 [rustup]。

本教程至少需要 Rust 版本 `1.45.0`，但建议使用最新的稳定版本。

要检查您的计算机上是否安装了 Rust，请运行以下命令：

```bash
$ rustc --version
```

您应该看到类似 `rustc 1.46.0 (04488afe3 2020-08-24)` 的输出。

### Mini-Redis 服务器

接下来，安装 Mini-Redis 服务器。这将用于在我们构建客户端时测试我们的客户端。

```bash
$ cargo install mini-redis
```

通过启动服务器确保它已成功安装：

```bash
$ mini-redis-server
```

然后，在另一个终端窗口中，尝试使用 `mini-redis-cli` 获取键 `foo`：

```bash
$ mini-redis-cli get foo
```

您应该看到 `(nil)`。

## 准备就绪

就是这样，一切都准备就绪了。转到下一页编写您的第一个异步 Rust 应用程序。

[redis]: https://redis.io
[mini-redis]: https://github.com/tokio-rs/mini-redis
[install-rust]: https://www.rust-lang.org/tools/install
[rustup]: https://rustup.rs/