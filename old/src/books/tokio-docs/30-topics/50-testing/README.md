# 单元测试

本页面的目的是提供关于如何在异步应用程序中编写有用的单元测试的建议。

### 在测试中暂停和恢复时间

有时，异步代码通过调用 [`tokio::time::sleep`] 或等待 [`tokio::time::Interval::tick`] 来显式等待。当单元测试开始运行得非常慢时，基于时间的行为测试（例如，指数退避）可能会变得繁琐。但是，在内部，tokio 的时间相关功能支持暂停和恢复时间。暂停时间的效果是任何与时间相关的 future 可能会提前准备就绪。与时间相关的 future 提前解析的条件是没有其他可能准备就绪的 future。当唯一等待的 future 与时间相关时，这本质上是快进时间：

```rust
#[tokio::test]
async fn paused_time() {
    tokio::time::pause();
    let start = std::time::Instant::now();
    tokio::time::sleep(Duration::from_millis(500)).await;
    println!("{:?}ms", start.elapsed().as_millis());
}
```

这段代码在合理的机器上打印 `0ms`。

对于单元测试，通常在整个过程中使用暂停时间是有用的。这可以通过简单地将宏参数 `start_paused` 设置为 `true` 来实现：

```rust
#[tokio::test(start_paused = true)]
async fn paused_time() {
    let start = std::time::Instant::now();
    tokio::time::sleep(Duration::from_millis(500)).await;
    println!("{:?}ms", start.elapsed().as_millis());
}
```

请记住，`start_paused` 属性需要 tokio 特性 `test-util`。
更多详情请参见 [tokio::test "配置运行时以暂停时间开始"](https://docs.rs/tokio/latest/tokio/attr.test.html#configure-the-runtime-to-start-with-time-paused)。

当然，即使使用不同的与时间相关的 future，future 解析的时间顺序也会保持：

```rust
#[tokio::test(start_paused = true)]
async fn interval_with_paused_time() {
    let mut interval = interval(Duration::from_millis(300));
    let _ = timeout(Duration::from_secs(1), async move {
        loop {
            interval.tick().await;
            println!("Tick!");
        }
    })
    .await;
}
```

这段代码立即打印 `"Tick!"` 恰好 4 次。

[`tokio::time::Interval::tick`]: https://docs.rs/tokio/1/tokio/time/struct.Interval.html#method.tick
[`tokio::time::sleep`]: https://docs.rs/tokio/1/tokio/time/fn.sleep.html

### 使用 [`AsyncRead`] 和 [`AsyncWrite`] 进行模拟

用于异步读写的通用 trait（[`AsyncRead`] 和 [`AsyncWrite`]）由例如套接字实现。它们可以用于模拟套接字执行的 I/O。

考虑这个简单的 TCP 服务器循环的设置：

```rust
use tokio::net::TcpListener;

#[tokio::main]
async fn main() {
    # if true { return }
    let listener = TcpListener::bind("127.0.0.1:8080").await.unwrap();
    loop {
        let Ok((mut socket, _)) = listener.accept().await else {
            eprintln!("Failed to accept client");
            continue;
        };        tokio::spawn(async move {
            let (reader, writer) = socket.split();
            // 运行一些客户端连接处理程序，例如：
            // handle_connection(reader, writer)
                // .await
                // .expect("Failed to handle connection");
        });
    }
}
```

在这里，每个 TCP 客户端连接都由其专用的 tokio 任务服务。这个任务拥有一个读取器和一个写入器，它们是从 [`TcpStream`] [`split`] 出来的。

现在考虑实际的客户端处理程序任务，特别是函数签名的 `where` 子句：

```rust
use tokio::io::{AsyncBufReadExt, AsyncRead, AsyncWrite, AsyncWriteExt, BufReader};

async fn handle_connection<Reader, Writer>(
    reader: Reader,
    mut writer: Writer,
) -> std::io::Result<()>
where
    Reader: AsyncRead + Unpin,
    Writer: AsyncWrite + Unpin,
{
    let mut line = String::new();
    let mut reader = BufReader::new(reader);

    loop {
        if let Ok(bytes_read) = reader.read_line(&mut line).await {
            if bytes_read == 0 {
                break Ok(());
            }
            writer
                .write_all(format!("Thanks for your message.\r\n").as_bytes())
                .await
                .unwrap();
        }
        line.clear();    }
}
```

本质上，给定的读取器和写入器（实现了 [`AsyncRead`] 和 [`AsyncWrite`]）被顺序服务。对于每个接收到的行，处理程序回复 `"Thanks for your message."`。

要对客户端连接处理程序进行单元测试，可以使用 [`tokio_test::io::Builder`] 作为模拟：

```rust
# use tokio::io::{AsyncBufReadExt, AsyncRead, AsyncWrite, AsyncWriteExt, BufReader};
#
# async fn handle_connection<Reader, Writer>(
#     reader: Reader,
#     mut writer: Writer,
# ) -> std::io::Result<()>
# where
#     Reader: AsyncRead + Unpin,
#     Writer: AsyncWrite + Unpin,
# {
#     let mut line = String::new();
#     let mut reader = BufReader::new(reader);
#
#     loop {
#         if let Ok(bytes_read) = reader.read_line(&mut line).await {
#             if bytes_read == 0 {
#                 break Ok(());
#             }
#             writer
#                 .write_all(format!("Thanks for your message.\r\n").as_bytes())
#                 .await
#                 .unwrap();
#         }
#         line.clear();
#     }
# }
#
#[tokio::test]
async fn client_handler_replies_politely() {
    let reader = tokio_test::io::Builder::new()
        .read(b"Hi there\r\n")
        .read(b"How are you doing?\r\n")
        .build();
    let writer = tokio_test::io::Builder::new()
        .write(b"Thanks for your message.\r\n")
        .write(b"Thanks for your message.\r\n")
        .build();
    let _ = handle_connection(reader, writer).await;
}
```

[`AsyncRead`]: https://docs.rs/tokio/latest/tokio/io/trait.AsyncRead.html
[`AsyncWrite`]: https://docs.rs/tokio/latest/tokio/io/trait.AsyncWrite.html
[`split`]: https://docs.rs/tokio/latest/tokio/net/struct.TcpStream.html#method.split
[`TcpStream`]: https://docs.rs/tokio/latest/tokio/net/struct.TcpStream.html
[`tokio_test::io::Builder`]: https://docs.rs/tokio-test/latest/tokio_test/io/struct.Builder.html
