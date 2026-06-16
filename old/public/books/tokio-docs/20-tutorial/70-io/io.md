# I/O

Tokio 中的 I/O 操作与 `std` 中的工作方式基本相同，但是是异步的。有一个用于读取的 trait（[`AsyncRead`]）和一个用于写入的 trait（[`AsyncWrite`]）。特定类型适当地实现这些 trait（[`TcpStream`]、[`File`]、[`Stdout`]）。[`AsyncRead`] 和 [`AsyncWrite`] 也由许多数据结构实现，如 `Vec<u8>` 和 `&[u8]`。这允许在需要读取器或写入器的地方使用字节数组。

本页将涵盖使用 Tokio 进行基本 I/O 读取和写入，并通过几个示例进行说明。下一页将介绍更高级的 I/O 示例。

## AsyncRead 和 AsyncWrite

这两个 trait 提供异步读取和写入字节流的功能。这些 trait 上的方法通常不直接调用，类似于您不会手动调用 `Future` trait 的 `poll` 方法。相反，您将通过 [`AsyncReadExt`] 和 [`AsyncWriteExt`] 提供的实用方法使用它们。

让我们简要查看这些方法中的几个。所有这些函数都是 `async` 的，必须与 `.await` 一起使用。

### async fn read()

[`AsyncReadExt::read`][read] 提供一个异步方法，用于将数据读取到缓冲区中，返回读取的字节数。

**注意：** 当 `read()` 返回 `Ok(0)` 时，这表示流已关闭。对 `read()` 的任何进一步调用都将立即完成并返回 `Ok(0)`。对于 [`TcpStream`] 实例，这表示套接字的读取一半已关闭。

```rust
use tokio::fs::File;
use tokio::io::{self, AsyncReadExt};

# fn dox() {
#[tokio::main]
async fn main() -> io::Result<()> {
    let mut f = File::open("foo.txt").await?;
    let mut buffer = [0; 10];

    // 读取最多 10 个字节
    let n = f.read(&mut buffer[..]).await?;

    println!("The bytes: {:?}", &buffer[..n]);
    Ok(())
}
# }
```

### `async fn read_to_end()`

[`AsyncReadExt::read_to_end`][read_to_end] 读取流中的所有字节，直到 EOF。

```rust
use tokio::io::{self, AsyncReadExt};
use tokio::fs::File;

# fn dox() {
#[tokio::main]
async fn main() -> io::Result<()> {
    let mut f = File::open("foo.txt").await?;
    let mut buffer = Vec::new();

    // 读取整个文件
    f.read_to_end(&mut buffer).await?;
    Ok(())
}
# }
```

### `async fn write()`

[`AsyncWriteExt::write`][write] 将缓冲区写入写入器，返回写入的字节数。

```rust
use tokio::io::{self, AsyncWriteExt};
use tokio::fs::File;

# fn dox() {
#[tokio::main]
async fn main() -> io::Result<()> {
    let mut file = File::create("foo.txt").await?;

    // 写入字节字符串的某些前缀，但不一定是全部。
    let n = file.write(b"some bytes").await?;

    println!("Wrote the first {} bytes of 'some bytes'.", n);
    Ok(())
}
# }
```

### `async fn write_all()`

[`AsyncWriteExt::write_all`][write_all] 将整个缓冲区写入写入器。

```rust
use tokio::io::{self, AsyncWriteExt};
use tokio::fs::File;

# fn dox() {
#[tokio::main]
async fn main() -> io::Result<()> {
    let mut file = File::create("foo.txt").await?;

    file.write_all(b"some bytes").await?;
    Ok(())
}
# }
```

这两个 trait 都包含许多其他有用的方法。请参阅 API 文档以获取完整列表。

## 辅助函数

此外，就像 `std` 一样，[`tokio::io`] 模块包含许多有用的实用函数以及用于处理[标准输入][stdin]、[标准输出][stdout]和[标准错误][stderr]的 API。例如，[`tokio::io::copy`][copy] 异步将读取器的全部内容复制到写入器中。

```rust
use tokio::fs::File;
use tokio::io;

# fn dox() {
#[tokio::main]
async fn main() -> io::Result<()> {
    let mut reader: &[u8] = b"hello";
    let mut file = File::create("foo.txt").await?;

    io::copy(&mut reader, &mut file).await?;
    Ok(())
}
# }
```

请注意，这利用了字节数组也实现 `AsyncRead` 的事实。

## Echo 服务器

让我们练习一下异步 I/O。我们将编写一个 echo 服务器。

echo 服务器绑定一个 `TcpListener` 并在循环中接受入站连接。对于每个入站连接，从套接字读取数据并立即写回套接字。客户端向服务器发送数据并接收完全相同的数据。

我们将使用稍微不同的策略实现 echo 服务器两次。

### 使用 `io::copy()`

首先，我们将使用 [`io::copy`][copy] 实用程序实现 echo 逻辑。

您可以在新的二进制文件中编写此代码：

```bash
$ touch src/bin/echo-server-copy.rs
```

您可以使用以下命令启动（或只是检查编译）：

```bash
$ cargo run --bin echo-server-copy
```

您可以使用标准命令行工具（如 `telnet`）来测试服务器，或者编写一个简单的客户端，类似于在 [`tokio::net::TcpStream`][tcp_example] 文档中找到的客户端。

这是一个 TCP 服务器，需要一个接受循环。为每个接受的套接字生成一个新的任务来处理。

```rust
use tokio::io;
use tokio::net::TcpListener;

# fn dox() {
#[tokio::main]
async fn main() -> io::Result<()> {
    let listener = TcpListener::bind("127.0.0.1:6142").await?;

    loop {
        let (mut socket, _) = listener.accept().await?;        tokio::spawn(async move {
            // 在这里复制数据
        });
    }
}
# }
```

如前所述，这个实用函数接受一个读取器和一个写入器，并将数据从一个复制到另一个。但是，我们只有一个 `TcpStream`。这个单一值**同时**实现了 `AsyncRead` 和 `AsyncWrite`。因为 `io::copy` 需要读取器和写入器都使用 `&mut`，所以套接字不能用于两个参数。

```rust,compile_fail
// 这无法编译
io::copy(&mut socket, &mut socket).await
```

### 分离读取器 + 写入器

为了解决这个问题，我们必须将套接字分离成一个读取器句柄和一个写入器句柄。分离读取器/写入器组合的最佳方法取决于具体类型。

任何读取器 + 写入器类型都可以使用 [`io::split`][split] 实用工具进行分离。这个函数接受一个单一值并返回单独的读取器和写入器句柄。这两个句柄可以独立使用，包括在单独的任务中使用。

例如，echo 客户端可以像这样处理并发读取和写入：

```rust
use tokio::io::{self, AsyncReadExt, AsyncWriteExt};
use tokio::net::TcpStream;

# fn dox() {
#[tokio::main]
async fn main() -> io::Result<()> {
    let socket = TcpStream::connect("127.0.0.1:6142").await?;
    let (mut rd, mut wr) = io::split(socket);    // 在后台写入数据
    tokio::spawn(async move {
        wr.write_all(b"hello\r\n").await?;
        wr.write_all(b"world\r\n").await?;

        // 有时，rust 类型推断器需要
        // 一点帮助
        Ok::<_, io::Error>(())
    });

    let mut buf = vec![0; 128];

    loop {
        let n = rd.read(&mut buf).await?;

        if n == 0 {
            break;
        }

        println!("GOT {:?}", &buf[..n]);
    }

    Ok(())
}
# }
```

因为 `io::split` 支持实现 `AsyncRead + AsyncWrite` 的**任何**值并返回独立句柄，所以 `io::split` 内部使用 `Arc` 和 `Mutex`。这种开销可以通过 `TcpStream` 来避免。`TcpStream` 提供两个专门的分离函数。

[`TcpStream::split`] 接受流的**引用**并返回读取器和写入器句柄。因为使用了引用，所以两个句柄必须保持在调用 `split()` 的**同一个**任务上。这种专门的 `split` 是零成本的。不需要 `Arc` 或 `Mutex`。`TcpStream` 还提供 [`into_split`]，它支持可以在任务之间移动的句柄，但代价是需要一个 `Arc`。

因为 `io::copy()` 在拥有 `TcpStream` 的同一个任务上调用，我们可以使用 [`TcpStream::split`]。服务器中处理 echo 逻辑的任务变为：

```rust
# use tokio::io;
# use tokio::net::TcpStream;
# fn dox(mut socket: TcpStream) {
tokio::spawn(async move {
    let (mut rd, mut wr) = socket.split();
      if io::copy(&mut rd, &mut wr).await.is_err() {
        eprintln!("复制失败");
    }
});
# }
```

您可以在[这里][full_copy]找到完整的代码。

### 手动复制

现在让我们看看如何通过手动复制数据来编写 echo 服务器。为此，我们使用 [`AsyncReadExt::read`][read] 和 [`AsyncWriteExt::write_all`][write_all]。

完整的 echo 服务器如下：

```rust
use tokio::io::{self, AsyncReadExt, AsyncWriteExt};
use tokio::net::TcpListener;

# fn dox() {
#[tokio::main]
async fn main() -> io::Result<()> {
    let listener = TcpListener::bind("127.0.0.1:6142").await?;

    loop {
        let (mut socket, _) = listener.accept().await?;

        tokio::spawn(async move {
            let mut buf = vec![0; 1024];

            loop {                match socket.read(&mut buf).await {
                    // 返回值 `Ok(0)` 表示远程端已关闭
                    Ok(0) => return,
                    Ok(n) => {
                        // 将数据复制回套接字
                        if socket.write_all(&buf[..n]).await.is_err() {
                            // 意外的套接字错误。我们在这里没有太多可以做的
                            // 所以只是停止处理。
                            return;
                        }
                    }
                    Err(_) => {
                        // 意外的套接字错误。我们在这里没有太多可以做的
                        // 所以只是停止处理。
                        return;
                    }
                }
            }
        });
    }
}
# }
```

（您可以将此代码放入 `src/bin/echo-server.rs` 并使用 `cargo run --bin echo-server` 启动它）。

让我们来分析一下。首先，因为使用了 `AsyncRead` 和 `AsyncWrite` 实用工具，必须将扩展 trait 引入作用域。

```rust
use tokio::io::{self, AsyncReadExt, AsyncWriteExt};
```

### 分配缓冲区

策略是从套接字读取一些数据到缓冲区，然后将缓冲区的内容写回套接字。

```rust
let mut buf = vec![0; 1024];
```

明确避免使用栈缓冲区。回想[之前][send]，我们注意到跨 `.await` 调用存在的所有任务数据必须由任务存储。在这种情况下，`buf` 在 `.await` 调用中被使用。所有任务数据都存储在单个分配中。您可以将其视为一个 `enum`，其中每个变体是特定 `.await` 调用需要存储的数据。

如果缓冲区由栈数组表示，则为每个接受的套接字生成的任务的内部结构可能如下所示：

```rust,compile_fail
struct Task {
    // 内部任务字段在这里
    task: enum {
        AwaitingRead {
            socket: TcpStream,
            buf: [BufferType],
        },
        AwaitingWriteAll {
            socket: TcpStream,
            buf: [BufferType],
        }

    }
}
```

如果使用栈数组作为缓冲区类型，它将*内联*存储在任务结构中。这将使任务结构变得非常大。此外，缓冲区大小通常是页面大小。这反过来将使 `Task` 成为一个尴尬的大小：`$page-size + a-few-bytes`。

编译器优化异步块的布局比基本的 `enum` 更进一步。在实践中，变量不会像 `enum` 所需的那样在变体之间移动。但是，任务结构大小至少与最大的变量一样大。

因此，通常为缓冲区使用专用分配会更高效。

### 处理 EOF

当 TCP 流的读取一半关闭时，对 `read()` 的调用返回 `Ok(0)`。在此时退出读取循环很重要。忘记在 EOF 时跳出读取循环是一个常见的错误来源。

```rust
# use tokio::io::AsyncReadExt;
# use tokio::net::TcpStream;
# async fn dox(mut socket: TcpStream) {
# let mut buf = vec![0_u8; 1024];
loop {    match socket.read(&mut buf).await {
        // 返回值 `Ok(0)` 表示远程端已关闭
        Ok(0) => return,
        // ... 其他情况在这里处理
# _ => unreachable!(),
    }
}
# }
```

忘记跳出读取循环通常会导致 100% CPU 无限循环的情况。当套接字关闭时，`socket.read()` 立即返回。然后循环永远重复。

完整代码可以在[这里][full_manual]找到。

[full_manual]: https://github.com/tokio-rs/website/blob/master/tutorial-code/io/src/echo-server.rs
[full_copy]: https://github.com/tokio-rs/website/blob/master/tutorial-code/io/src/echo-server-copy.rs

[send]: /tokio/tutorial/spawning#send-bound

[`AsyncRead`]: https://docs.rs/tokio/1/tokio/io/trait.AsyncRead.html
[`AsyncWrite`]: https://docs.rs/tokio/1/tokio/io/trait.AsyncWrite.html
[`AsyncReadExt`]: https://docs.rs/tokio/1/tokio/io/trait.AsyncReadExt.html
[`AsyncWriteExt`]: https://docs.rs/tokio/1/tokio/io/trait.AsyncWriteExt.html
[`TcpStream`]: https://docs.rs/tokio/1/tokio/net/struct.TcpStream.html
[`File`]: https://docs.rs/tokio/1/tokio/fs/struct.File.html
[`Stdout`]: https://docs.rs/tokio/1/tokio/io/struct.Stdout.html
[read]: https://docs.rs/tokio/1/tokio/io/trait.AsyncReadExt.html#method.read
[read_to_end]: https://docs.rs/tokio/1/tokio/io/trait.AsyncReadExt.html#method.read_to_end
[write]: https://docs.rs/tokio/1/tokio/io/trait.AsyncWriteExt.html#method.write
[write_all]: https://docs.rs/tokio/1/tokio/io/trait.AsyncWriteExt.html#method.write_all
[`tokio::io`]: https://docs.rs/tokio/1/tokio/io/index.html
[stdin]: https://docs.rs/tokio/1/tokio/io/fn.stdin.html
[stdout]: https://docs.rs/tokio/1/tokio/io/fn.stdout.html
[stderr]: https://docs.rs/tokio/1/tokio/io/fn.stderr.html
[copy]: https://docs.rs/tokio/1/tokio/io/fn.copy.html
[split]: https://docs.rs/tokio/1/tokio/io/fn.split.html
[`TcpStream::split`]: https://docs.rs/tokio/1/tokio/net/struct.TcpStream.html#method.split
[`into_split`]: https://docs.rs/tokio/1/tokio/net/struct.TcpStream.html#method.into_split
[tcp_example]: https://docs.rs/tokio/1/tokio/net/struct.TcpStream.html#examples