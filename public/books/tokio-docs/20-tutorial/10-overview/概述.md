# 概述

[Commit 6876546](https://github.com/tokio-rs/website/commit/68765467d8d168c959ac39ba7cc37df7cee3678e)

Tokio 是 Rust 编程语言的异步运行时。它提供了编写网络应用程序所需的构建块。它提供了针对各种系统的灵活性，从拥有数十个核心的大型服务器到小型嵌入式设备。

在高层次上，Tokio 提供了几个主要组件：

 - 用于执行异步代码的多线程运行时。
 - 标准库的异步版本。
 - 庞大的库生态系统。

## Tokio 在您项目中的作用

当您以异步方式编写应用程序时，通过降低同时执行多个任务的成本，使其能够更好地扩展。然而，异步 Rust 代码无法独立运行，因此您必须选择一个运行时来执行它。Tokio 库是使用最广泛的运行时，其使用量超过了所有其他运行时的总和。

此外，Tokio 提供了许多有用的工具。在编写异步代码时，您无法使用 Rust 标准库提供的普通阻塞 API，而必须使用它们的异步版本。这些替代版本由 Tokio 提供，在合理的情况下镜像 Rust 标准库的 API。

## Tokio 的优势

本节将概述 Tokio 的一些优势。

### 高性能

Tokio _非常快_，构建在 Rust 编程语言之上，而 Rust 本身就很快。这是在 Rust 精神指导下完成的，目标是您无法通过手工编写等效代码来改善性能。

Tokio 具有_可扩展性_，构建在 async/await 语言特性之上，这个特性本身就是可扩展的。在处理网络时，由于延迟的限制，您处理连接的速度是有限的，因此扩展的唯一方法是同时处理许多连接。借助 async/await 语言特性，增加并发操作的数量变得极其廉价，允许您扩展到大量的并发任务。

### 可靠性

Tokio 使用 Rust 构建，Rust 是一门赋予每个人构建可靠高效软件能力的语言。[许多][microsoft][研究][chrome]发现，大约 70% 的高严重性安全漏洞是由内存不安全造成的。使用 Rust 可以在您的应用程序中消除这整类错误。

Tokio 还非常注重提供一致的行为，没有意外情况。Tokio 的主要目标是允许用户部署可预测的软件，这些软件将日复一日地表现相同，具有可靠的响应时间，没有不可预测的延迟峰值。

[microsoft]: https://www.zdnet.com/article/microsoft-70-percent-of-all-security-bugs-are-memory-safety-issues/
[chrome]: https://www.chromium.org/Home/chromium-security/memory-safety

### 易用性

借助 Rust 的 async/await 特性，编写异步应用程序的复杂性大大降低了。结合 Tokio 的工具和活跃的生态系统，编写应用程序变得轻而易举。

Tokio 在合理的情况下遵循标准库的命名约定。这使得将仅使用标准库编写的代码轻松转换为使用 Tokio 编写的代码。借助 Rust 强大的类型系统，轻松交付正确代码的能力是无与伦比的。

### 灵活性

Tokio 提供运行时的多种变体。从多线程的[工作窃取][work-stealing]运行时到轻量级的单线程运行时，应有尽有。这些运行时都带有许多调节旋钮，允许用户根据自己的需求进行调优。

[work-stealing]: https://en.wikipedia.org/wiki/Work_stealing

## 何时不使用 Tokio

尽管 Tokio 对许多需要同时处理大量任务的项目很有用，但也有一些 Tokio 不适合的用例。

 - 通过在多个线程上并行运行来加速 CPU 密集型计算。Tokio 专为 IO 密集型应用程序设计，其中每个单独的任务大部分时间都在等待 IO。如果您的应用程序只是并行运行计算，您应该使用 [rayon]。话虽如此，如果您需要两者兼而有之，仍然可以"混合匹配"。请参阅[这篇博客文章的实际示例][rayon-example]。
 - 读取大量文件。虽然看起来 Tokio 对于只需要读取大量文件的项目很有用，但与普通线程池相比，Tokio 在这里没有提供任何优势。这是因为操作系统通常不提供异步文件 API。
 - 发送单个 Web 请求。Tokio 给您带来优势的地方是当您需要同时做很多事情时。如果您需要使用专为异步 Rust 设计的库（如 [reqwest]），但您不需要同时做很多事情，您应该首选该库的阻塞版本，因为它会让您的项目更简单。使用 Tokio 当然仍然可以工作，但与阻塞 API 相比没有真正的优势。如果库不提供阻塞 API，请参阅[与同步代码桥接的章节][bridging]。

[rayon]: https://docs.rs/rayon/
[rayon-example]: https://ryhl.io/blog/async-what-is-blocking/#the-rayon-crate
[reqwest]: https://docs.rs/reqwest/
[bridging]: /tokio/topics/bridging

## 获取帮助

在任何时候，如果您遇到困难，您总是可以在 [Discord] 或 [GitHub 讨论][disc] 上获得帮助。不要担心询问"初学者"问题。我们都是从某个地方开始的，很乐意提供帮助。

[discord]: https://discord.gg/tokio
[disc]: https://github.com/tokio-rs/tokio/discussions