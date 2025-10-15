# 追踪入门

[`tracing`] crate 是一个用于检测 Rust 程序以收集结构化、基于事件的诊断信息的框架。

在像 Tokio 这样的异步系统中，解释传统的日志消息通常非常具有挑战性。由于各个任务在同一线程上复用，相关的事件和日志行会混合在一起，使得跟踪逻辑流程变得困难。`tracing` 通过允许库和应用程序记录带有关于*时间性*和*因果关系*附加信息的结构化事件来扩展日志样式的诊断——与日志消息不同，`tracing` 中的 [`Span`] 有开始和结束时间，可能被执行流程进入和退出，并且可能存在于类似跨度的嵌套树中。为了表示在单个时刻发生的事情，`tracing` 提供了*事件*的补充概念。[`Span`] 和 [`Event`] 都是*结构化的*，具有记录类型化数据以及文本消息的能力。

[`Span`]: https://docs.rs/tracing/latest/tracing/#spans
[`Event`]: https://docs.rs/tracing/latest/tracing/#events

您可以使用 `tracing` 来：

- 向 [OpenTelemetry] 收集器发出分布式追踪
- 使用 [Tokio Console] 调试您的应用程序
- 记录到 [`stdout`]、[日志文件] 或 [`journald`]
- [分析] 您的应用程序在哪里花费时间

[`tracing`]: https://docs.rs/tracing
[`tracing-subscriber`]: https://docs.rs/tracing-subscriber
[OpenTelemetry]: https://docs.rs/tracing-opentelemetry
[Tokio Console]: https://docs.rs/console-subscriber
[`stdout`]: https://docs.rs/tracing-subscriber/latest/tracing_subscriber/fmt/index.html
[日志文件]: https://docs.rs/tracing-appender/latest/tracing_appender/
[`journald`]: https://docs.rs/tracing-journald/latest/tracing_journald/
[分析]: https://docs.rs/tracing-timing/latest/tracing_timing/

## 设置

首先，添加 [`tracing`] 和 [`tracing-subscriber`] 作为依赖项：

```toml
[dependencies]
tracing = "0.1"
tracing-subscriber = "0.3"
```

[`tracing`] crate 提供了我们将用来发出追踪的 API。[`tracing-subscriber`] crate 提供了一些基本实用程序，用于将这些追踪转发给外部监听器（例如 `stdout`）。

## 订阅追踪

如果您正在编写可执行文件（而不是库），您需要注册一个追踪[*订阅者*]。订阅者是处理应用程序及其依赖项发出的追踪的类型，可以执行诸如计算指标、监控错误以及将追踪重新发出到外部世界（例如 `journald`、`stdout` 或 `open-telemetry` 守护程序）等任务。

[*订阅者*]: https://docs.rs/tracing/latest/tracing/#subscribers

在大多数情况下，您应该在 `main` 函数中尽早注册您的追踪订阅者。例如，[`tracing-subscriber`] 提供的 [`FmtSubscriber`] 类型将格式化的追踪和事件打印到 `stdout`，可以这样注册：

```rust
# mod mini_redis {
#       pub type Error = Box<dyn std::error::Error + Send + Sync>;
#       pub type Result<T> = std::result::Result<T, Error>;
# }
#[tokio::main]
pub async fn main() -> mini_redis::Result<()> {
    // 构造一个将格式化追踪打印到 stdout 的订阅者
    let subscriber = tracing_subscriber::FmtSubscriber::new();
    // 使用该订阅者处理此点之后发出的追踪
    tracing::subscriber::set_global_default(subscriber)?;
# /*
    ...
# */ Ok(())
}
```

[`FmtSubscriber`]: https://docs.rs/tracing-subscriber/latest/tracing_subscriber/fmt/index.html

如果您现在运行应用程序，您可能会看到 Tokio 发出的一些追踪事件，但您需要修改自己的应用程序以发出追踪才能充分利用 `tracing`。

### 订阅者配置

在上面的示例中，我们使用默认配置配置了 [`FmtSubscriber`]。但是，`tracing-subscriber` 还提供了许多配置 [`FmtSubscriber`] 行为的方法，例如自定义输出格式、在日志中包含附加信息（如线程 ID 或源代码位置），以及将日志写入 `stdout` 以外的地方。

例如：
```rust
// 开始配置 `fmt` 订阅者
let subscriber = tracing_subscriber::fmt()
    // 使用更紧凑、简化的日志格式
    .compact()
    // 显示源代码文件路径
    .with_file(true)
    // 显示源代码行号
    .with_line_number(true)
    // 显示记录事件的线程 ID
    .with_thread_ids(true)
    // 不显示事件的目标（模块路径）
    .with_target(false)
    // 构建订阅者
    .finish();
```

有关可用配置选项的详细信息，请参阅 [`tracing_subscriber::fmt` 文档][fmt-cfg]。

除了来自 [`tracing-subscriber`] 的 [`FmtSubscriber`] 类型之外，其他 `Subscriber` 可以实现自己记录 `tracing` 数据的方式。这包括替代输出格式、分析和聚合，以及与其他系统（如分布式追踪或日志聚合服务）的集成。许多 crate 提供了可能感兴趣的额外 `Subscriber` 实现。有关额外 `Subscriber` 实现的（不完整）列表，请参见[这里][related-crates]。

最后，在某些情况下，将多种不同的记录追踪方式组合在一起以构建实现多种行为的单个 `Subscriber` 可能很有用。为此，`tracing-subscriber` crate 提供了一个 [`Layer`] trait，它表示可以与其他 `Layer` 组合在一起形成 `Subscriber` 的组件。有关使用 `Layer` 的详细信息，请参见[这里][`Layer`]。

[fmt-cfg]: https://docs.rs/tracing-subscriber/latest/tracing_subscriber/fmt/index.html#configuration
[related-crates]: https://docs.rs/tracing/latest/tracing/index.html#related-crates
[`Layer`]: https://docs.rs/tracing-subscriber/latest/tracing_subscriber/layer/index.html

## 发出跨度和事件

发出跨度的最简单方法是使用 [`tracing`] 提供的 [`instrument`] 过程宏注解，它重写函数体以在每次调用时发出跨度；例如：

```rust
#[tracing::instrument]
fn trace_me(a: u32, b: u32) -> u32 {
    a + b
}
```

`trace_me` 的每次调用都会发出一个 `tracing` 跨度，该跨度：

1. 具有 `info` 的详细程度[级别]（"中等"详细程度），
2. 命名为 `trace_me`，
3. 具有字段 `a` 和 `b`，其值为 `trace_me` 的参数

[`instrument`]: https://docs.rs/tracing/latest/tracing/attr.instrument.html

[`instrument`] 属性是高度可配置的；例如，要追踪 [`mini-redis-server`] 中处理每个连接的方法：

[`mini-redis-server`]: ../tutorial/setup#mini-redis

```rust
# struct Handler {
#     connection: tokio::net::TcpStream,
# }
# pub type Error = Box<dyn std::error::Error + Send + Sync>;
# pub type Result<T> = std::result::Result<T, Error>;
use tracing::instrument;

impl Handler {
    /// 处理单个连接。
    #[instrument(
        name = "Handler::run",
        skip(self),
        fields(
            // `%` 使用 `Display` 序列化对等端 IP 地址
            peer_addr = %self.connection.peer_addr().unwrap()
        ),
    )]
    async fn run(&mut self) -> mini_redis::Result<()> {
# /*
        ...
# */ Ok::<_, _>(())
    }
}
```

[`mini-redis-server`] 现在将为每个传入连接发出一个 `tracing` 跨度，该跨度：

1. 具有 `info` 的详细程度[级别]（"中等"详细程度），
2. 命名为 `Handler::run`，
3. 具有与其关联的一些结构化数据。
    - `fields(...)` 表示发出的跨度*应该*在名为 `peer_addr` 的字段中包含连接的 `SocketAddr` 的 `fmt::Display` 表示。
    - `skip(self)` 表示发出的跨度*不应该*记录 `Handler` 的调试表示。

[级别]: https://docs.rs/tracing/latest/tracing/struct.Level.html

您还可以通过调用 [`span!`] 宏或其任何级别化简写形式（[`error_span!`]、[`warn_span!`]、[`info_span!`]、[`debug_span!`]、[`trace_span!`]）来手动构造 [`Span`]。

[`span!`]: https://docs.rs/tracing/*/tracing/macro.span.html
[`error_span!`]: https://docs.rs/tracing/*/tracing/macro.error_span.html
[`warn_span!`]: https://docs.rs/tracing/*/tracing/macro.warn_span.html
[`info_span!`]: https://docs.rs/tracing/*/tracing/macro.info_span.html
[`debug_span!`]: https://docs.rs/tracing/*/tracing/macro.debug_span.html
[`trace_span!`]: https://docs.rs/tracing/*/tracing/macro.trace_span.html

要发出事件，调用 [`event!`] 宏或其任何级别化简写形式（[`error!`]、[`warn!`]、[`info!`]、[`debug!`]、[`trace!`]）。例如，要记录客户端发送了格式错误的命令：
```rust
# type Error = Box<dyn std::error::Error + Send + Sync>;
# type Result<T> = std::result::Result<T, Error>;
# struct Command;
# impl Command {
#     fn from_frame<T>(frame: T) -> Result<()> {
#         Result::Ok(())
#     }
#     fn from_error<T>(err: T) {}
# }
# let frame = ();
// 将 redis 帧转换为命令结构。如果帧不是有效的 redis 命令，这将返回错误。
let cmd = match Command::from_frame(frame) {
    Ok(cmd) => cmd,
    Err(cause) => {
        // 帧格式错误，无法解析。这可能表明客户端（而非我们的服务器）有问题，
        // 所以我们 (1) 发出警告...
        //
        // 这里的语法是 `tracing` crate 提供的简写。它可以被认为类似于：
        //      tracing::warn! {
        //          cause = format!("{}", cause),
        //          "failed to parse command from frame"
        //      };
        // `tracing` 提供结构化日志记录，因此信息以键值对的形式"记录"。
        tracing::warn! {
            %cause,
            "failed to parse command from frame"
        };
        // ...并且 (2) 向客户端响应错误：
        Command::from_error(cause)
    }
};
```

[`event!`]: https://docs.rs/tracing/*/tracing/macro.event.html
[`error!`]: https://docs.rs/tracing/*/tracing/macro.error.html
[`warn!`]: https://docs.rs/tracing/*/tracing/macro.warn.html
[`info!`]: https://docs.rs/tracing/*/tracing/macro.info.html
[`debug!`]: https://docs.rs/tracing/*/tracing/macro.debug.html
[`trace!`]: https://docs.rs/tracing/*/tracing/macro.trace.html

如果您运行应用程序，现在将看到为其处理的每个传入连接发出的事件，这些事件使用其跨度的上下文进行装饰。