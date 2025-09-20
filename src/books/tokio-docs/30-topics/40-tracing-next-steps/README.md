# 追踪的下一步

## Tokio-console

[`tokio-console`](https://github.com/tokio-rs/console) 是一个类似 htop 的工具，
可以实时查看应用程序的跨度和事件。它还可以显示 Tokio 运行时创建的“资源”，例如任务。
在开发过程中，它对于理解性能问题至关重要。

例如，要在 [mini-redis 项目](https://github.com/tokio-rs/mini-redis) 中使用 tokio-console，
你需要为 Tokio 包启用 `tracing` 特性：

```toml
# Update the tokio import in your Cargo.toml
tokio = { version = "1", features = ["full", "tracing"] }
```

注意：`full` 特性不会启用 `tracing`。

你还需要添加 `console-subscriber` 包的依赖。这个 crate 提供了一个 `Subscriber` 实现，它将替换 mini-redis 当前使用的订阅者：

```toml
# Add this to the dependencies section of your Cargo.toml
console-subscriber = "0.1.5"
```

最后，在 `src/bin/server.rs` 中，将对 `tracing_subscriber` 的调用替换为对 `console-subscriber` 的调用：

替换这个：

```rust
# use std::error::Error;
tracing_subscriber::fmt::try_init()?;
# Ok::<(), Box<dyn Error + Send + Sync + 'static>>(())
```

...替换为这个：

```rust
console_subscriber::init();
```

这将启用 `console_subscriber`，这意味着任何与 `tokio-console` 相关的仪器都将被记录。输出到标准输出的日志仍然会发生（基于 `RUST_LOG` 环境变量的值）。

现在我们应该准备好再次启动 mini-redis，这次使用 `tokio_unstable` 标志（这是启用追踪所需的）：

```sh
RUSTFLAGS="--cfg tokio_unstable" cargo run --bin mini-redis-server
```

`tokio_unstable` 标志允许我们使用 Tokio 提供的额外 API，这些 API 目前没有稳定性保证（换句话说，这些 API 允许破坏性更改）。

剩下的就是在另一个终端中运行控制台本身。最简单的方法是从 crates.io 安装：

```sh
cargo install --locked tokio-console
```

然后运行：

```sh
tokio-console
```

你将看到的初始视图是当前正在运行的 tokio 任务。
示例：![tokio-console 任务视图](https://raw.githubusercontent.com/tokio-rs/console/main/assets/tasks_list.png)

它还可以在任务完成后的一段时间内显示任务（这些任务的颜色将是灰色）。你可以通过运行 mini-redis hello world 示例来生成一些追踪（这在 [mini-redis 仓库](https://github.com/tokio-rs/mini-redis) 中可用）：

```sh
cargo run --example hello_world
```

如果你按 `r`，你可以切换到资源视图。这显示了 Tokio 运行时正在使用的信号量、互斥锁和其他构造。
示例：![tokio-console 资源视图](https://raw.githubusercontent.com/tokio-rs/console/main/assets/resources.png)

每当你需要内省 Tokio 运行时以更好地理解应用程序性能时，你可以使用 tokio-console 实时查看正在发生的事情，帮助你发现死锁和其他问题。

要了解更多关于如何使用 tokio-console 的信息，请访问[其文档页面](https://docs.rs/tokio-console/latest/tokio_console/#using-the-console)。

## 与 OpenTelemetry 集成

[OpenTelemetry](https://opentelemetry.io/) (OTel) 意味着多个方面；首先，它是一个开放规范，定义了追踪和指标的数据模型，可以处理大多数用户的需求。它也是一组特定于语言的 SDK，提供仪器，以便可以从应用程序发出追踪和指标。第三，有 OpenTelemetry Collector，这是一个与你的应用程序一起运行的二进制文件，用于收集追踪和指标，最终将这些数据推送到遥测供应商，如 DataDog、Honeycomb 或 AWS X-Ray。它也可以将数据发送到 Prometheus 等工具。

[opentelemetry crate](https://crates.io/crates/opentelemetry) 是为 Rust 提供 OpenTelemetry SDK 的包，也是我们将在本教程中使用的包。

在本教程中，我们将设置 mini-redis 向 [Jaeger](https://www.jaegertracing.io/) 发送数据，Jaeger 是一个用于可视化追踪的 UI。

要运行 Jaeger 实例，你可以使用 Docker：

```sh
docker run -d -p6831:6831/udp -p6832:6832/udp -p16686:16686 -p14268:14268 jaegertracing/all-in-one:latest
```

你可以通过访问 <http://localhost:16686> 来查看 Jaeger 页面。
它看起来像这样：
![Jaeger UI](/img/tracing-next-steps/jaeger-first-pageload.png)

一旦我们生成并发送了一些追踪数据，我们将回到这个页面。

要设置 mini-redis，我们首先需要添加一些依赖项。用以下内容更新你的 `Cargo.toml`：

```toml
# 实现 Otel 规范中定义的类型
opentelemetry = "0.17.0"
# tracing crate 和 opentelemetry crate 之间的集成
tracing-opentelemetry = "0.17.2" 
# 允许你将数据导出到 Jaeger
opentelemetry-jaeger = "0.16.0"
```

现在，在 `src/bin/server.rs` 中，添加以下导入：

```rust
use opentelemetry::global;
use tracing_subscriber::{
    fmt, layer::SubscriberExt, util::SubscriberInitExt,
};
```

我们稍后会看看这些各自的作用。

下一步是将对 `tracing_subscriber` 的调用替换为 OTel 设置。

替换这个：

```rust
# use std::error::Error;
tracing_subscriber::fmt::try_init()?;
# Ok::<(), Box<dyn Error + Send + Sync + 'static>>(())
```

...替换为这个：

```rust
# use std::error::Error;
# use opentelemetry::global;
# use tracing_subscriber::{
#     fmt, layer::SubscriberExt, util::SubscriberInitExt,
# };
// 允许你跨服务传递上下文（即追踪 ID）
global::set_text_map_propagator(opentelemetry_jaeger::Propagator::new());
// 设置将数据导出到 Jaeger 所需的机制
// 还有其他 OTel crate 为前面提到的供应商提供管道。
let tracer = opentelemetry_jaeger::new_pipeline()
    .with_service_name("mini-redis")
    .install_simple()?;

// 使用配置的追踪器创建追踪层
let opentelemetry = tracing_opentelemetry::layer().with_tracer(tracer);

// 需要 SubscriberExt 和 SubscriberInitExt trait 来扩展
// Registry 以接受 `opentelemetry`（OpenTelemetryLayer 类型）。
tracing_subscriber::registry()
    .with(opentelemetry)
    // 继续记录到标准输出
    .with(fmt::Layer::default())
    .try_init()?;
# Ok::<(), Box<dyn Error + Send + Sync + 'static>>(())
```

现在你应该能够启动 mini-redis：

```sh
cargo run --bin mini-redis-server
```

在另一个终端中，运行 hello world 示例（这在 [mini-redis 仓库](https://github.com/tokio-rs/mini-redis) 中可用）：

```sh
cargo run --example hello_world
```

现在，刷新我们之前打开的 Jaeger UI，在主搜索页面上，在服务下拉菜单中找到 "mini-redis" 选项。

选择该选项，然后点击"查找追踪"按钮。这应该显示我们刚刚通过运行示例发出的请求。
![Jaeger UI, mini-redis 概览](/img/tracing-next-steps/jaeger-mini-redis-overview.png)

点击追踪应该向你显示在处理 hello world 示例期间发出的跨度的详细视图。
![Jaeger UI, mini-redis 请求详情](/img/tracing-next-steps/jaeger-mini-redis-trace-details.png)

目前就这些！你可以通过发送更多请求、为 mini-redis 添加额外的仪器或设置 OTel 与遥测供应商（而不是我们在本地运行的 Jaeger 实例）来进一步探索。对于最后一个，你可能需要引入额外的 crate（例如，要将数据发送到 OTel Collector，你需要 `opentelemetry-otlp` crate）。在 [opentelemetry-rust 仓库](https://github.com/open-telemetry/opentelemetry-rust/tree/main/examples) 中有许多可用的示例。

注意：mini-redis 仓库已经包含了与 AWS X-Ray 的完整 OpenTelemetry 示例，详细信息可以在 [`README`](https://github.com/tokio-rs/mini-redis#aws-x-ray-example) 以及 [`Cargo.toml`](https://github.com/tokio-rs/mini-redis/blob/24d9d9f466d9078c46477bf5c2d68416553b9872/Cargo.toml#L35-L41) 和 [`src/bin/server.rs`](https://github.com/tokio-rs/mini-redis/blob/24d9d9f466d9078c46477bf5c2d68416553b9872/src/bin/server.rs#L59-L94) 文件中找到。