# 生成任务

我们将转换一下思路，开始工作在 Redis 服务器上。

首先，将上一节中的客户端 `SET`/`GET` 代码移动到一个示例文件中。这样，我们就可以针对我们的服务器运行它。

```bash
$ mkdir -p examples
$ mv src/main.rs examples/hello-redis.rs
```

然后创建一个新的空的 `src/main.rs` 并继续。

## 接受套接字

我们的 Redis 服务器需要做的第一件事是接受入站 TCP 套接字。这是通过将 [`tokio::net::TcpListener`][tcpl] 绑定到端口 **6379** 来完成的。

> **信息**
> Tokio 的许多类型与 Rust 标准库中对应的同步类型同名。在合理的情况下，Tokio 公开与 `std` 相同的 API，但使用 `async fn`。

然后在循环中接受套接字。每个套接字被处理后关闭。现在，我们将读取命令，将其打印到标准输出并响应一个错误。

`src/main.rs`

```rust
use tokio::net::{TcpListener, TcpStream};
use mini_redis::{Connection, Frame};

# fn dox() {
#[tokio::main]
async fn main() {
    // 将监听器绑定到地址
    let listener = TcpListener::bind("127.0.0.1:6379").await.unwrap();

    loop {
        // 第二个项目包含新连接的 IP 和端口。
        let (socket, _) = listener.accept().await.unwrap();
        process(socket).await;
    }
}
# }

async fn process(socket: TcpStream) {
    // `Connection` 让我们读取/写入 redis **帧** 而不是
    // 字节流。`Connection` 类型由 mini-redis 定义。
    let mut connection = Connection::new(socket);

    if let Some(frame) = connection.read_frame().await.unwrap() {
        println!("GOT: {:?}", frame);

        // 使用错误响应
        let response = Frame::Error("unimplemented".to_string());
        connection.write_frame(&response).await.unwrap();
    }
}
```

现在，运行这个接受循环：

```bash
$ cargo run
```

在另一个终端窗口中，运行 `hello-redis` 示例（上一节中的 `SET`/`GET` 命令）：

```bash
$ cargo run --example hello-redis
```

输出应该是：

```text
Error: "unimplemented"
```

在服务器终端中，输出是：

```text
GOT: Array([Bulk(b"set"), Bulk(b"hello"), Bulk(b"world")])
```

[tcpl]: https://docs.rs/tokio/1/tokio/net/struct.TcpListener.html

## 并发

我们的服务器有一个小问题（除了只响应错误之外）。它一次处理一个入站请求。当接受连接时，服务器停留在接受循环块内，直到响应完全写入套接字。

我们希望我们的 Redis 服务器处理**许多**并发请求。为此，我们需要添加一些并发性。

> **信息**
> 并发和并行不是同一回事。如果您在两个任务之间交替，那么您正在同时处理两个任务，但不是并行处理。要符合并行条件，您需要两个人，每人专门负责一个任务。
>
> 使用 Tokio 的优势之一是异步代码允许您同时处理许多任务，而无需使用普通线程并行处理它们。实际上，Tokio 可以在单个线程上同时运行许多任务！

为了并发处理连接，为每个入站连接生成一个新任务。连接在此任务上处理。

接受循环变成：

```rust
use tokio::net::TcpListener;

# fn dox() {
#[tokio::main]
async fn main() {
    let listener = TcpListener::bind("127.0.0.1:6379").await.unwrap();

    loop {
        let (socket, _) = listener.accept().await.unwrap();
        // 为每个入站套接字生成一个新任务。套接字被
        // 移动到新任务并在那里处理。
        tokio::spawn(async move {
            process(socket).await;
        });
    }
}
# }
# async fn process(_: tokio::net::TcpStream) {}
```

### 任务

Tokio 任务是异步绿色线程。它们通过将 `async` 块传递给 `tokio::spawn` 来创建。`tokio::spawn` 函数返回一个 `JoinHandle`，调用者可以使用它与生成的任务进行交互。`async` 块可能有返回值。调用者可以通过在 `JoinHandle` 上使用 `.await` 来获取返回值。

例如：

```rust
#[tokio::main]
async fn main() {
    let handle = tokio::spawn(async {
        // 做一些异步工作
        "return value"
    });

    // 做一些其他工作

    let out = handle.await.unwrap();
    println!("GOT {}", out);
}
```

等待 `JoinHandle` 返回一个 `Result`。当任务在执行期间遇到错误时，`JoinHandle` 将返回 `Err`。当任务恐慌或任务被运行时强制取消关闭时，会发生这种情况。

任务是调度器管理的执行单元。生成任务将其提交给 Tokio 调度器，然后调度器确保任务在有工作要做时执行。生成的任务可能在生成它的同一线程上执行，也可能在不同的运行时线程上执行。任务在生成后也可以在线程之间移动。

Tokio 中的任务非常轻量级。在内部，它们只需要一个分配和 64 字节的内存。应用程序应该随意生成数千甚至数百万个任务。

### `'static` 绑定

当您在 Tokio 运行时上生成任务时，其类型的生命周期必须是 `'static`。这意味着生成的任务不能包含对任务外部拥有的数据的任何引用。

> **信息**
> 一个常见的误解是 `'static` 总是意味着"永远存在"，但事实并非如此。仅仅因为一个值是 `'static` 并不意味着您有内存泄漏。您可以在[常见的 Rust 生命周期误解][common-lifetime]中阅读更多内容。

[common-lifetime]: https://github.com/pretzelhammer/rust-blog/blob/master/posts/common-rust-lifetime-misconceptions.md#2-if-t-static-then-t-must-be-valid-for-the-entire-program

例如，以下代码不会编译：

```rust,compile_fail
use tokio::task;

#[tokio::main]
async fn main() {
    let v = vec![1, 2, 3];

    task::spawn(async {
        println!("Here's a vec: {:?}", v);
    });
}
```

尝试编译这会导致以下错误：

```text
error[E0373]: async block may outlive the current function, but
              it borrows `v`, which is owned by the current function
 --> src/main.rs:7:23
  |
7 |       task::spawn(async {
  |  _______________________^
8 | |         println!("Here's a vec: {:?}", v);
  | |                                        - `v` is borrowed here
9 | |     });
  | |_____^ may outlive borrowed value `v`
  |
note: function requires argument type to outlive `'static`
 --> src/main.rs:7:17
  |
7 |       task::spawn(async {
  |  _________________^
8 | |         println!("Here's a vector: {:?}", v);
9 | |     });
  | |_____^
help: to force the async block to take ownership of `v` (and any other
      referenced variables), use the `move` keyword
  |
7 |     task::spawn(async move {
8 |         println!("Here's a vec: {:?}", v);
9 |     });
  |
```

这是因为默认情况下，变量不会**移动**到异步块中。`v` 向量仍然由 `main` 函数拥有。`println!` 行借用了 `v`。Rust 编译器有用地向我们解释了这一点，甚至建议了修复方法！将第 7 行更改为 `task::spawn(async move {` 将指示编译器将 `v` **移动**到生成的任务中。现在，任务拥有其所有数据，使其成为 `'static`。

如果一个数据必须从多个任务并发访问，那么它必须使用同步原语（如 `Arc`）进行共享。

请注意，错误消息谈论参数类型*outliving* `'static` 生命周期。这种术语可能相当令人困惑，因为 `'static` 生命周期持续到程序结束，所以如果它比它更长，难道您没有内存泄漏吗？解释是它是*类型*，而不是*值*必须超过 `'static` 生命周期，值可能在其类型不再有效之前被销毁。

当我们说一个值是 `'static` 时，所有意思是永远保留该值不会是错误的。这很重要，因为编译器无法推理新生成的任务会存在多长时间。我们必须确保任务被允许永远存在，以便 Tokio 可以让任务根据需要运行多长时间。

信息框之前链接的文章使用术语"bounded by `'static`"而不是"its type outlives `'static`"或"the value is `'static`"来指代 `T: 'static`。这些都意味着同一件事，但与"annotated with `'static`"（如 `&'static T`）不同。

### `Send` 约束

由 `tokio::spawn` 生成的任务**必须**实现 `Send`。这允许 Tokio 运行时在任务在 `.await` 处挂起时在线程之间移动任务。

当在 `.await` 调用**之间**持有的**所有**数据都是 `Send` 时，任务是 `Send` 的。这有点微妙。当调用 `.await` 时，任务会让出控制权给调度器。下次执行任务时，它会从上次让出的点恢复。为了使这个工作，在 `.await` **之后**使用的所有状态都必须由任务保存。如果这个状态是 `Send` 的，即可以在线程之间移动，那么任务本身也可以在线程之间移动。相反，如果状态不是 `Send` 的，那么任务也不是。

例如，这可以工作：

```rust
use tokio::task::yield_now;
use std::rc::Rc;

#[tokio::main]
async fn main() {
    tokio::spawn(async {
        // 作用域强制 `rc` 在 `.await` 之前丢弃。
        {
            let rc = Rc::new("hello");
            println!("{}", rc);
        }

        // `rc` 不再使用。当任务让出给调度器时，它**不会**被持久化
        yield_now().await;
    });
}
```

这不能：

```rust,compile_fail
use tokio::task::yield_now;
use std::rc::Rc;

#[tokio::main]
async fn main() {
    tokio::spawn(async {
        let rc = Rc::new("hello");

        // `rc` 在 `.await` 之后使用。它必须持久化到任务的状态中。
        yield_now().await;

        println!("{}", rc);
    });
}
```

尝试编译这个片段会导致：

```text
error: future cannot be sent between threads safely
   --> src/main.rs:6:5
    |
6   |     tokio::spawn(async {
    |     ^^^^^^^^^^^^ future created by async block is not `Send`
    | 
   ::: [..]spawn.rs:127:21
    |
127 |         T: Future + Send + 'static,
    |                     ---- required by this bound in
    |                          `tokio::task::spawn::spawn`
    |
    = help: within `impl std::future::Future`, the trait
    |       `std::marker::Send` is not  implemented for
    |       `std::rc::Rc<&str>`
note: future is not `Send` as this value is used across an await
   --> src/main.rs:10:9
    |
7   |         let rc = Rc::new("hello");
    |             -- has type `std::rc::Rc<&str>` which is not `Send`
...
10  |         yield_now().await;
    |         ^^^^^^^^^^^^^^^^^ await occurs here, with `rc` maybe
    |                           used later
11  |         println!("{}", rc);
12  |     });
    |     - `rc` is later dropped here
```

我们将在[下一章][mutex-guard]更深入地讨论这种错误的特殊情况。

[mutex-guard]: shared-state#holding-a-mutexguard-across-an-await

## 存储值

我们现在将实现 `process` 函数来处理传入的命令。我们将使用 `HashMap` 来存储值。`SET` 命令将插入到 `HashMap` 中，`GET` 值将加载它们。此外，我们将使用循环来接受每个连接的多个命令。

```rust
use tokio::net::TcpStream;
use mini_redis::{Connection, Frame};

async fn process(socket: TcpStream) {
    use mini_redis::Command::{self, Get, Set};
    use std::collections::HashMap;

    // 使用 hashmap 来存储数据
    let mut db = HashMap::new();

    // Connection 由 `mini-redis` 提供，处理从套接字解析帧
    let mut connection = Connection::new(socket);

    // 使用 `read_frame` 从连接接收命令。
    while let Some(frame) = connection.read_frame().await.unwrap() {
        let response = match Command::from_frame(frame).unwrap() {
            Set(cmd) => {
                // 值存储为 `Vec<u8>`
                db.insert(cmd.key().to_string(), cmd.value().to_vec());
                Frame::Simple("OK".to_string())
            }
            Get(cmd) => {
                if let Some(value) = db.get(cmd.key()) {
                    // `Frame::Bulk` 期望数据是 `Bytes` 类型。这个
                    // 类型将在教程后面介绍。现在，
                    // `&Vec<u8>` 使用 `into()` 转换为 `Bytes`。
                    Frame::Bulk(value.clone().into())
                } else {
                    Frame::Null
                }
            }
            cmd => panic!("unimplemented {:?}", cmd),
        };

        // 将响应写入客户端
        connection.write_frame(&response).await.unwrap();
    }
}
```

现在，启动服务器：

```bash
$ cargo run
```

在另一个终端窗口中，运行 `hello-redis` 示例：

```bash
$ cargo run --example hello-redis
```

现在，输出将是：

```text
got value from the server; result=Some(b"world")
```

我们现在可以获取和设置值，但有一个问题：值不在连接之间共享。如果另一个套接字连接并尝试 `GET` `hello` 键，它将找不到任何内容。

您可以在[这里][full]找到完整的代码。

在下一节中，我们将实现为所有套接字持久化数据。

[full]: https://github.com/tokio-rs/website/blob/master/tutorial-code/spawning/src/main.rs