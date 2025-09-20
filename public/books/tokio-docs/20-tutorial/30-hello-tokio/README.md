# Hello Tokio

我们将通过编写一个非常基本的 Tokio 应用程序来开始。它将连接到 Mini-Redis 服务器，将键 `hello` 的值设置为 `world`。然后它将读取该键。这将使用 Mini-Redis 客户端库来完成。

## 代码

### 生成一个新的 crate

让我们首先生成一个新的 Rust 应用程序：

```bash
$ cargo new my-redis
$ cd my-redis
```

### 添加依赖项

接下来，打开 `Cargo.toml` 并在 `[dependencies]` 下方添加以下内容：

```toml
tokio = { version = "1", features = ["full"] }
mini-redis = "0.4"
```

### 编写代码

然后，打开 `main.rs` 并将文件内容替换为：

```rust
use mini_redis::{client, Result};

# fn dox() {
#[tokio::main]
async fn main() -> Result<()> {
    // 打开到 mini-redis 地址的连接。
    let mut client = client::connect("127.0.0.1:6379").await?;

    // 设置键 "hello" 的值为 "world"
    client.set("hello", "world".into()).await?;

    // 获取键 "hello"
    let result = client.get("hello").await?;

    println!("got value from the server; result={:?}", result);

    Ok(())
}
# }
```

确保 Mini-Redis 服务器正在运行。在另一个终端窗口中，运行：

```bash
$ mini-redis-server
```

如果您还没有安装 mini-redis，可以这样做：

```bash
$ cargo install mini-redis
```

现在，运行 `my-redis` 应用程序：

```bash
$ cargo run
got value from the server; result=Some(b"world")
```

成功！

您可以在[这里][full]找到完整的代码。

[full]: https://github.com/tokio-rs/website/blob/master/tutorial-code/hello-tokio/src/main.rs

## 代码解析

让我们花一些时间来回顾一下我们刚才做的事情。代码不多，但发生了很多事情。

```rust
# use mini_redis::client;
# async fn dox() -> mini_redis::Result<()> {
let mut client = client::connect("127.0.0.1:6379").await?;
# Ok(())
# }
```

[`client::connect`] 函数由 `mini-redis` crate 提供。它异步地与指定的远程地址建立 TCP 连接。一旦连接建立，就会返回一个 `client` 句柄。尽管操作是异步执行的，但我们编写的代码**看起来**是同步的。唯一表明操作是异步的是 `.await` 操作符。

[`client::connect`]: https://docs.rs/mini-redis/0.4/mini_redis/client/fn.connect.html

### 什么是异步编程？

大多数计算机程序按照编写的顺序执行。第一行执行，然后是下一行，依此类推。在同步编程中，当程序遇到无法立即完成的操作时，它会阻塞直到操作完成。例如，建立 TCP 连接需要通过网络与对等方进行交换，这可能需要相当长的时间。在此期间，线程被阻塞。

在异步编程中，无法立即完成的操作被挂起到后台。线程不会被阻塞，可以继续运行其他事情。一旦操作完成，任务就会被恢复并从停止的地方继续处理。我们之前的示例只有一个任务，所以在它被挂起时什么都不会发生，但异步程序通常有许多这样的任务。

尽管异步编程可以带来更快的应用程序，但它往往会导致程序变得更加复杂。程序员需要跟踪所有必要的状态，以便在异步操作完成后恢复工作。从历史上看，这是一项繁琐且容易出错的任务。

### 编译时绿色线程

Rust 使用一个名为 [`async/await`] 的特性来实现异步编程。执行异步操作的函数用 `async` 关键字标记。在我们的示例中，`connect` 函数是这样定义的：

```rust
use mini_redis::Result;
use mini_redis::client::Client;
use tokio::net::ToSocketAddrs;

pub async fn connect<T: ToSocketAddrs>(addr: T) -> Result<Client> {
    // ...
# unimplemented!()
}
```

`async fn` 定义看起来像常规的同步函数，但是异步操作。Rust 在**编译**时将 `async fn` 转换为异步操作的例程。`async fn` 内对 `.await` 的任何调用都会将控制权交还给线程。线程可以在操作在后台处理时执行其他工作。

> **警告**
> 尽管其他语言也实现了 [`async/await`]，但 Rust 采用了独特的方法。主要是，Rust 的异步操作是**惰性的**。这导致与其他语言不同的运行时语义。

[`async/await`]: https://en.wikipedia.org/wiki/Async/await

如果这还不太理解，别担心。我们将在整个指南中进一步探索 `async/await`。

### 使用 `async/await`

异步函数的调用就像任何其他 Rust 函数一样。但是，调用这些函数不会导致函数体执行。相反，调用 `async fn` 会返回一个表示操作的值。这在概念上类似于零参数闭包。要实际运行操作，您应该在返回值上使用 `.await` 操作符。

例如，给定的程序

```rust
async fn say_world() {
    println!("world");
}

#[tokio::main]
async fn main() {
    // 调用 `say_world()` 不会执行 `say_world()` 的函数体。
    let op = say_world();

    // 这个 println! 首先执行
    println!("hello");

    // 在 `op` 上调用 `.await` 开始执行 `say_world`。
    op.await;
}
```

输出：

```text
hello
world
```

`async fn` 的返回值是一个实现了 [`Future`] trait 的匿名类型。

[`Future`]: https://doc.rust-lang.org/std/future/trait.Future.html

### 异步 `main` 函数

用于启动应用程序的主函数与 Rust 大多数 crate 中常见的主函数不同。

1. 它是一个 `async fn`
2. 它用 `#[tokio::main]` 注解

使用 `async fn` 是因为我们想要进入异步上下文。但是，异步函数必须由[运行时][runtime]执行。运行时包含异步任务调度器，提供事件驱动 I/O、定时器等。运行时不会自动启动，所以主函数需要启动它。

`#[tokio::main]` 函数是一个宏。它将 `async fn main()` 转换为同步的 `fn main()`，该函数初始化运行时实例并执行异步主函数。

例如，以下代码：

```rust
#[tokio::main]
async fn main() {
    println!("hello");
}
```

被转换为：

```rust
fn main() {
    let mut rt = tokio::runtime::Runtime::new().unwrap();
    rt.block_on(async {
        println!("hello");
    })
}
```

Tokio 运行时的详细信息将在后面介绍。

[runtime]: https://docs.rs/tokio/1/tokio/runtime/index.html

### Cargo 特性

在本教程中依赖 Tokio 时，启用了 `full` 特性标志：

```toml
tokio = { version = "1", features = ["full"] }
```

Tokio 有很多功能（TCP、UDP、Unix 套接字、定时器、同步工具、多种调度器类型等）。并非所有应用程序都需要所有功能。当尝试优化编译时间或最终应用程序占用空间时，应用程序可以决定**仅**选择它使用的功能。