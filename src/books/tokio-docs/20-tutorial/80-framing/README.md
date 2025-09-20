# 帧（Framing）

我们现在将应用刚才学到的关于 I/O 的知识，并实现 Mini-Redis 帧层。帧化是将字节流转换为帧流的过程。帧是两个对等端之间传输的数据单元。Redis 协议帧定义如下：

```rust
use bytes::Bytes;

enum Frame {
    Simple(String),
    Error(String),
    Integer(u64),
    Bulk(Bytes),
    Null,
    Array(Vec<Frame>),
}
```

请注意，帧只包含数据而没有任何语义。命令解析和实现发生在更高的层次。

对于 HTTP，帧可能如下所示：

```rust
# use bytes::Bytes;
# type Method = ();
# type Uri = ();
# type Version = ();
# type HeaderMap = ();
# type StatusCode = ();
enum HttpFrame {
    RequestHead {
        method: Method,
        uri: Uri,
        version: Version,
        headers: HeaderMap,
    },
    ResponseHead {
        status: StatusCode,
        version: Version,
        headers: HeaderMap,
    },
    BodyChunk {
        chunk: Bytes,
    },
}
```

为了实现 Mini-Redis 的帧化，我们将实现一个包装 `TcpStream` 的 `Connection` 结构，并读取/写入 `mini_redis::Frame` 值。

```rust
use tokio::net::TcpStream;
use mini_redis::{Frame, Result};

struct Connection {
    stream: TcpStream,
    // ... 其他字段在这里
}

impl Connection {    /// 从连接读取一个帧。
    /// 
    /// 如果到达 EOF 则返回 `None`    pub async fn read_frame(&mut self)
        -> Result<Option<Frame>>
    {
        // 实现在这里
# unimplemented!();
    }

    /// 向连接写入一个帧。
    pub async fn write_frame(&mut self, frame: &Frame)
        -> Result<()>
    {
        // 实现在这里
# unimplemented!();
    }
}
```

您可以在[这里][proto]找到 Redis 线路协议的详细信息。完整的 `Connection` 代码在[这里][full]找到。

[proto]: https://redis.io/topics/protocol
[full]: https://github.com/tokio-rs/mini-redis/blob/tutorial/src/connection.rs

## 缓冲读取

`read_frame` 方法等待接收到完整的帧后才返回。对 `TcpStream::read()` 的单次调用可能返回任意数量的数据。它可能包含完整的帧、部分帧或多个帧。如果接收到部分帧，数据会被缓冲，并从套接字读取更多数据。如果接收到多个帧，返回第一个帧，其余数据被缓冲直到下次调用 `read_frame`。

如果您还没有，请创建一个名为 `connection.rs` 的新文件。

```bash
touch src/connection.rs
```

为了实现这一点，`Connection` 需要一个读取缓冲区字段。数据从套接字读取到读取缓冲区中。当解析出一个帧时，相应的数据从缓冲区中移除。

我们将使用 [`BytesMut`][BytesMutStruct] 作为缓冲区类型。这是 [`Bytes`][BytesStruct] 的可变版本。

```rust
use bytes::BytesMut;
use tokio::net::TcpStream;

pub struct Connection {
    stream: TcpStream,
    buffer: BytesMut,
}

impl Connection {
    pub fn new(stream: TcpStream) -> Connection {        Connection {
            stream,
            // 分配 4kb 容量的缓冲区。
            buffer: BytesMut::with_capacity(4096),
        }
    }
}
```

接下来，我们实现 `read_frame()` 方法。

```rust
use tokio::io::AsyncReadExt;
use bytes::Buf;
use mini_redis::Result;

# struct Connection {
#   stream: tokio::net::TcpStream,
#   buffer: bytes::BytesMut,
# }
# struct Frame {}
# impl Connection {
pub async fn read_frame(&mut self)
    -> Result<Option<Frame>>
{    loop {
        // 尝试从缓冲的数据中解析一个帧。如果
        // 缓冲了足够的数据，则返回帧。
        if let Some(frame) = self.parse_frame()? {
            return Ok(Some(frame));
        }

        // 没有足够的缓冲数据来读取一个帧。
        // 尝试从套接字读取更多数据。
        //
        // 成功时，返回字节数。`0`
        // 表示"流结束"。
        if 0 == self.stream.read_buf(&mut self.buffer).await? {
            // 远程端关闭了连接。为了让这成为
            // 一个干净的关闭，读取缓冲区中应该没有数据。
            // 如果有，这意味着对等端在发送帧时关闭了套接字。
            if self.buffer.is_empty() {
                return Ok(None);
            } else {
                return Err("connection reset by peer".into());
            }
        }
    }
}
# fn parse_frame(&self) -> Result<Option<Frame>> { unimplemented!() }
# }
```

让我们来分析一下。`read_frame` 方法在循环中操作。首先，调用 `self.parse_frame()`。这将尝试从 `self.buffer` 解析一个 redis 帧。如果有足够的数据来解析一个帧，则将帧返回给 `read_frame()` 的调用者。否则，我们尝试从套接字读取更多数据到缓冲区中。读取更多数据后，再次调用 `parse_frame()`。这次，如果接收到足够的数据，解析可能会成功。

从流读取时，返回值 `0` 表示将不会从对等端接收到更多数据。如果读取缓冲区中仍有数据，这表示接收到了部分帧，连接被突然终止。这是一个错误条件，返回 `Err`。

[BytesMutStruct]: https://docs.rs/bytes/1/bytes/struct.BytesMut.html
[BytesStruct]: https://docs.rs/bytes/1/bytes/struct.Bytes.html

### `Buf` trait

从流读取时，调用 `read_buf`。这个版本的读取函数接受一个实现了来自 [`bytes`] crate 的 [`BufMut`] 的值。

首先，考虑我们如何使用 `read()` 实现相同的读取循环。
`Vec<u8>` 可以代替 `BytesMut` 使用。

```rust
use tokio::net::TcpStream;

pub struct Connection {
    stream: TcpStream,
    buffer: Vec<u8>,
    cursor: usize,
}

impl Connection {
    pub fn new(stream: TcpStream) -> Connection {
        Connection {
            stream,
            // 分配 4kb 容量的缓冲区。
            buffer: vec![0; 4096],
            cursor: 0,
        }
    }
}
```

以及 `Connection` 上的 `read_frame()` 函数：

```rust
use mini_redis::{Frame, Result};

# use tokio::io::AsyncReadExt;
# pub struct Connection {
#     stream: tokio::net::TcpStream,
#     buffer: Vec<u8>,
#     cursor: usize,
# }
# impl Connection {
pub async fn read_frame(&mut self)
    -> Result<Option<Frame>>
{
    loop {
        if let Some(frame) = self.parse_frame()? {
            return Ok(Some(frame));
        }        // 确保缓冲区有容量
        if self.buffer.len() == self.cursor {
            // 增长缓冲区
            self.buffer.resize(self.cursor * 2, 0);
        }

        // 读取到缓冲区中，跟踪
        // 读取的字节数
        let n = self.stream.read(
            &mut self.buffer[self.cursor..]).await?;

        if 0 == n {
            if self.cursor == 0 {
                return Ok(None);
            } else {
                return Err("connection reset by peer".into());
            }
        } else {
            // 更新我们的游标
            self.cursor += n;
        }
    }
}
# fn parse_frame(&mut self) -> Result<Option<Frame>> { unimplemented!() }
# }
```

使用字节数组和 `read` 时，我们还必须维护一个游标来跟踪已缓冲了多少数据。我们必须确保将缓冲区的空白部分传递给 `read()`。否则，我们会覆盖已缓冲的数据。如果我们的缓冲区被填满，我们必须增长缓冲区以便继续读取。在 `parse_frame()`（未包含）中，我们需要解析 `self.buffer[..self.cursor]` 中包含的数据。

因为将字节数组与游标配对是非常常见的，`bytes` crate 提供了一个表示字节数组和游标的抽象。`Buf` trait 由可以从中读取数据的类型实现。`BufMut` trait 由可以向其中写入数据的类型实现。当将 `T: BufMut` 传递给 `read_buf()` 时，缓冲区的内部游标由 `read_buf` 自动更新。因此，在我们的 `read_frame` 版本中，我们不需要管理自己的游标。

此外，当使用 `Vec<u8>` 时，缓冲区必须被**初始化**。`vec![0; 4096]` 分配一个 4096 字节的数组并向每个条目写入零。调整缓冲区大小时，新容量也必须用零初始化。初始化过程不是免费的。当使用 `BytesMut` 和 `BufMut` 时，容量是**未初始化的**。`BytesMut` 抽象防止我们读取未初始化的内存。这让我们避免了初始化步骤。

[`BufMut`]: https://docs.rs/bytes/1/bytes/buf/trait.BufMut.html
[`bytes`]: https://docs.rs/bytes/

## 解析

现在，让我们看看 `parse_frame()` 函数。解析分两步完成。

1. 确保缓冲了完整的帧并找到帧的结束索引。
2. 解析帧。

`mini-redis` crate 为这两个步骤都提供了函数：

1. [`Frame::check`](https://docs.rs/mini-redis/0.4/mini_redis/frame/enum.Frame.html#method.check)
2. [`Frame::parse`](https://docs.rs/mini-redis/0.4/mini_redis/frame/enum.Frame.html#method.parse)

我们还将重用 `Buf` 抽象来帮助。将 `Buf` 传递给 `Frame::check`。当 `check` 函数迭代传入的缓冲区时，内部游标将前进。当 `check` 返回时，缓冲区的内部游标指向帧的末尾。

对于 `Buf` 类型，我们将使用 [`std::io::Cursor<&[u8]>`][`Cursor`]。

```rust
use mini_redis::{Frame, Result};
use mini_redis::frame::Error::Incomplete;
use bytes::Buf;
use std::io::Cursor;

# pub struct Connection {
#     stream: tokio::net::TcpStream,
#     buffer: bytes::BytesMut,
# }
# impl Connection {
fn parse_frame(&mut self)
    -> Result<Option<Frame>>
{
    // Create the `T: Buf` type.
    let mut buf = Cursor::new(&self.buffer[..]);

    // Check whether a full frame is available
    match Frame::check(&mut buf) {        Ok(_) => {
            // 获取帧的字节长度
            let len = buf.position() as usize;

            // 为调用 `parse` 重置内部游标。
            buf.set_position(0);

            // 解析帧
            let frame = Frame::parse(&mut buf)?;

            // 从缓冲区丢弃帧
            self.buffer.advance(len);

            // 将帧返回给调用者。
            Ok(Some(frame))
        }
        // 没有缓冲足够的数据
        Err(Incomplete) => Ok(None),
        // 遇到了错误
        Err(e) => Err(e.into()),
    }
}
# }
```

完整的 [`Frame::check`][check] 函数可以在[这里][check]找到。我们不会完整地涵盖它。

需要注意的相关事项是使用了 `Buf` 的"字节迭代器"风格的 API。这些 API 获取数据并推进内部游标。例如，要解析一个帧，首先检查第一个字节以确定帧的类型。使用的函数是 [`Buf::get_u8`]。这获取当前游标位置的字节并将游标前进一位。

[`Buf`] trait 上还有更多有用的方法。查看 [API 文档][`Buf`] 了解更多详细信息。

[check]: https://github.com/tokio-rs/mini-redis/blob/tutorial/src/frame.rs#L65-L103
[`Buf::get_u8`]: https://docs.rs/bytes/1/bytes/buf/trait.Buf.html#method.get_u8
[`Buf`]: https://docs.rs/bytes/1/bytes/buf/trait.Buf.html
[`Cursor`]: https://doc.rust-lang.org/stable/std/io/struct.Cursor.html

## 缓冲写入

帧 API 的另一半是 `write_frame(frame)` 函数。此函数将整个帧写入套接字。为了最小化 `write` 系统调用，写入将被缓冲。维护一个写入缓冲区，在写入套接字之前将帧编码到此缓冲区。但是，与 `read_frame()` 不同，整个帧在写入套接字之前并不总是缓冲到字节数组中。

考虑一个批量流帧。被写入的值是 `Frame::Bulk(Bytes)`。批量帧的线路格式是一个帧头，它由 `$` 字符后跟数据的字节长度组成。帧的大部分是 `Bytes` 值的内容。如果数据很大，将其复制到中间缓冲区将是昂贵的。

为了实现缓冲写入，我们将使用 [`BufWriter` 结构][buf-writer]。此结构使用 `T: AsyncWrite` 进行初始化，并自己实现 `AsyncWrite`。当在 `BufWriter` 上调用 `write` 时，写入不会直接转到内部写入器，而是转到缓冲区。当缓冲区满时，内容被刷新到内部写入器，内部缓冲区被清空。还有一些优化允许在某些情况下绕过缓冲区。

我们不会尝试作为教程的一部分完整实现 `write_frame()`。请参阅[这里][write-frame]的完整实现。

首先，更新 `Connection` 结构：

```rust
use tokio::io::BufWriter;
use tokio::net::TcpStream;
use bytes::BytesMut;

pub struct Connection {
    stream: BufWriter<TcpStream>,
    buffer: BytesMut,
}

impl Connection {
    pub fn new(stream: TcpStream) -> Connection {
        Connection {
            stream: BufWriter::new(stream),
            buffer: BytesMut::with_capacity(4096),
        }
    }
}
```

Next, `write_frame()` is implemented.

```rust
use tokio::io::{self, AsyncWriteExt};
use mini_redis::Frame;

# struct Connection {
#   stream: tokio::io::BufWriter<tokio::net::TcpStream>,
#   buffer: bytes::BytesMut,
# }
# impl Connection {
async fn write_frame(&mut self, frame: &Frame)
    -> io::Result<()>
{
    match frame {
        Frame::Simple(val) => {
            self.stream.write_u8(b'+').await?;
            self.stream.write_all(val.as_bytes()).await?;
            self.stream.write_all(b"\r\n").await?;
        }
        Frame::Error(val) => {
            self.stream.write_u8(b'-').await?;
            self.stream.write_all(val.as_bytes()).await?;
            self.stream.write_all(b"\r\n").await?;
        }
        Frame::Integer(val) => {
            self.stream.write_u8(b':').await?;
            self.write_decimal(*val).await?;
        }
        Frame::Null => {
            self.stream.write_all(b"$-1\r\n").await?;
        }
        Frame::Bulk(val) => {
            let len = val.len();

            self.stream.write_u8(b'$').await?;
            self.write_decimal(len as u64).await?;
            self.stream.write_all(val).await?;
            self.stream.write_all(b"\r\n").await?;
        }
        Frame::Array(_val) => unimplemented!(),
    }    self.stream.flush().await;

    Ok(())
}
# async fn write_decimal(&mut self, val: u64) -> io::Result<()> { unimplemented!() }
# }
```

这里使用的函数由 [`AsyncWriteExt`] 提供。它们在 `TcpStream` 上也可用，但在没有中间缓冲区的情况下发出单字节写入是不明智的。

* [`write_u8`] 向写入器写入单个字节。
* [`write_all`] 将整个切片写入写入器。
* [`write_decimal`] 由 mini-redis 实现。

函数以调用 `self.stream.flush().await` 结束。因为 `BufWriter` 将写入存储在中间缓冲区中，对 `write` 的调用不保证数据被写入套接字。在返回之前，我们希望帧被写入套接字。对 `flush()` 的调用将缓冲区中待处理的任何数据写入套接字。

另一种选择是**不**在 `write_frame()` 中调用 `flush()`。相反，在 `Connection` 上提供一个 `flush()` 函数。这将允许调用者在写入缓冲区中排队多个小帧，然后用一个 `write` 系统调用将它们全部写入套接字。这样做会使 `Connection` API 复杂化。简单性是 Mini-Redis 的目标之一，所以我们决定在 `fn write_frame()` 中包含 `flush().await` 调用。

[buf-writer]: https://docs.rs/tokio/1/tokio/io/struct.BufWriter.html
[write-frame]: https://github.com/tokio-rs/mini-redis/blob/tutorial/src/connection.rs#L159-L184
[`AsyncWriteExt`]: https://docs.rs/tokio/1/tokio/io/trait.AsyncWriteExt.html
[`write_u8`]: https://docs.rs/tokio/1/tokio/io/trait.AsyncWriteExt.html#method.write_u8
[`write_all`]: https://docs.rs/tokio/1/tokio/io/trait.AsyncWriteExt.html#method.write_all
[`write_decimal`]: https://github.com/tokio-rs/mini-redis/blob/tutorial/src/connection.rs#L225-L238