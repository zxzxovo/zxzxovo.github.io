# 词汇表

## 异步（Asynchronous）

在 Rust 的上下文中，异步代码指的是使用 async/await 语言特性的代码，它允许许多任务在少数线程（甚至单个线程）上并发运行。

## 并发和并行（Concurrency and parallelism）

并发和并行是两个相关的概念，都用于谈论同时执行多个任务。如果某事并行发生，那么它也并发发生，但反之不然：在两个任务之间交替，但从不实际同时处理两个任务是并发但不是并行。

## Future

Future 是一个存储某个操作当前状态的值。Future 也有一个 `poll` 方法，使操作继续执行直到它需要等待某些东西，比如网络连接。对 `poll` 方法的调用应该很快返回。

Future 通常通过在异步块中使用 `.await` 组合多个 future 来创建。

## 执行器/调度器（Executor/scheduler）

执行器或调度器是通过重复调用 `poll` 方法来执行 future 的东西。标准库中没有执行器，所以你需要一个外部库，最广泛使用的执行器由 Tokio 运行时提供。

执行器能够在少数线程上并发运行大量的 future。它通过在等待点交换当前运行的任务来做到这一点。如果代码在不到达 `.await` 的情况下花费很长时间，这被称为"阻塞线程"或"不向执行器让步"，这会阻止其他任务运行。

## 运行时（Runtime）

运行时是一个包含执行器以及与该执行器集成的各种实用程序的库，如定时实用程序和 IO。运行时和执行器这两个词有时互换使用。标准库没有运行时，所以你需要一个外部库，最广泛使用的运行时是 Tokio 运行时。

Runtime 这个词也用在其他上下文中，例如短语"Rust 没有运行时"有时用来表示 Rust 不执行垃圾收集或即时编译。

## 任务（Task）

任务是在 Tokio 运行时上运行的操作，由 [`tokio::spawn`] 或 [`Runtime::block_on`] 函数创建。用于通过组合 future 来创建 future 的工具，如 `.await` 和 [`join!`] 不会创建新任务，每个组合部分被称为"在同一个任务中"。

并行需要多个任务，但可以使用 `join!` 等工具在一个任务上并发地做多件事。

[`Runtime::block_on`]: https://docs.rs/tokio/1/tokio/runtime/struct.Runtime.html#method.block_on
[`join!`]: https://docs.rs/tokio/1/tokio/macro.join.html

## 生成（Spawning）

生成是指使用 [`tokio::spawn`] 函数创建新任务。它也可以指使用 [`std::thread::spawn`] 创建新线程。

[`tokio::spawn`]: https://docs.rs/tokio/1/tokio/fn.spawn.html
[`std::thread::spawn`]: https://doc.rust-lang.org/stable/std/thread/fn.spawn.html

## 异步块（Async block）

异步块是一种创建运行某些代码的 future 的简单方法。例如：

```rust
let world = async {
    println!(" world!");
};
let my_future = async {
    print!("Hello ");
    world.await;
};
```

上面的代码创建了一个名为 `my_future` 的 future，如果执行它会打印 `Hello world!`。它首先打印 hello，然后运行 `world` future。注意上面的代码本身不会打印任何东西——你必须实际执行 `my_future` 才会发生任何事情，通过直接生成它，或通过在你生成的东西中 `.await` 它。

## 异步函数（Async function）

与异步块类似，异步函数是一种创建函数的简单方法，其主体成为一个 future。所有异步函数都可以重写为返回 future 的普通函数：

```rust
async fn do_stuff(i: i32) -> String {
    // 做一些事情
    format!("The integer is {}.", i)
}
```

```rust
use std::future::Future;

// 上面的异步函数与这个相同：
fn do_stuff(i: i32) -> impl Future<Output = String> {
    async move {
        // 做一些事情
        format!("The integer is {}.", i)
    }
}
```

这使用 [`impl Trait` 语法][book10-02] 来返回一个 future，因为 [`Future`] 是一个 trait。注意，由于异步块创建的 future 在执行之前不会做任何事情，调用异步函数在返回的 future 被执行之前不会做任何事情（[忽略它会触发警告][unused-warning]）。

[book10-02]: https://doc.rust-lang.org/book/ch10-02-traits.html#returning-types-that-implement-traits
[`Future`]: https://doc.rust-lang.org/stable/std/future/trait.Future.html
[unused-warning]: https://play.rust-lang.org/?version=stable&mode=debug&edition=2018&gist=4faf44e08b4a3bb1269a7985460f1923

## 让步（Yielding）

在异步 Rust 的上下文中，让步是允许执行器在单个线程上执行许多 future 的东西。每次 future 让步时，执行器能够将该 future 与其他 future 交换，通过重复交换当前任务，执行器可以并发执行大量任务。Future 只能在 `.await` 处让步，所以在 `.await` 之间花费很长时间的 future 可能会阻止其他任务运行。

具体来说，future 在从 [`poll`] 方法返回时让步。

[`poll`]: https://doc.rust-lang.org/stable/std/future/trait.Future.html#method.poll

## 阻塞（Blocking）

"阻塞"一词以两种不同的方式使用：第一种"阻塞"的含义只是等待某些东西完成，另一种阻塞的含义是当 future 在不让步的情况下花费很长时间。为了消除歧义，你可以对第二种含义使用短语"阻塞线程"。

Tokio 的文档将始终使用"阻塞"的第二种含义。

要在 Tokio 内运行阻塞代码，请参见 Tokio API 参考中的 [CPU 密集型任务和阻塞代码][api-blocking] 部分。
code][api-blocking] section from the Tokio API reference.

[api-blocking]: https://docs.rs/tokio/1/tokio/#cpu-bound-tasks-and-blocking-code

## 流（Stream）

[`Stream`] 是 [`Iterator`] 的异步版本，提供一个值流。它通常与 `while let` 循环一起使用，如下所示：

```rust
use tokio_stream::StreamExt; // for next()

# async fn dox() {
# let mut stream = tokio_stream::empty::<()>();
while let Some(item) = stream.next().await {
    // 做一些事情
}
# }
```

令人困惑的是，stream 这个词有时用来指 [`AsyncRead`] 和 [`AsyncWrite`] trait。

Tokio 的流实用程序目前由 [`tokio-stream`] crate 提供。一旦 `Stream` trait 在 std 中稳定，流实用程序将移动到 `tokio` crate 中。

[`Stream`]: https://docs.rs/tokio-stream/0.1/tokio/trait.Stream.html
[`tokio-stream`]: https://docs.rs/tokio-stream
[`Iterator`]: https://doc.rust-lang.org/stable/std/iter/trait.Iterator.html
[`AsyncRead`]: https://docs.rs/tokio/1/tokio/io/trait.AsyncRead.html
[`AsyncWrite`]: https://docs.rs/tokio/1/tokio/io/trait.AsyncWrite.html

## 通道（Channel）

通道是一个工具，允许代码的一部分向其他部分发送消息。Tokio 提供了[许多通道][channels]，每个都有不同的用途。

- [mpsc]：多生产者，单消费者通道。可以发送许多值。
- [oneshot]：单生产者，单消费者通道。可以发送单个值。
- [broadcast]：多生产者，多消费者。可以发送许多值。每个接收者都看到每个值。
- [watch]：单生产者，多消费者。可以发送许多值，但不保留历史记录。接收者只看到最新的值。

如果你需要一个多生产者多消费者通道，其中只有一个消费者看到每条消息，你可以使用 [`async-channel`] crate。

还有用于异步 Rust 之外的通道，如
[`std::sync::mpsc`] 和 [`crossbeam::channel`]。这些通道通过阻塞线程来等待消息，这在异步代码中是不允许的。

[channels]: https://docs.rs/tokio/1/tokio/sync/index.html
[mpsc]: https://docs.rs/tokio/1/tokio/sync/mpsc/index.html
[oneshot]: https://docs.rs/tokio/1/tokio/sync/oneshot/index.html
[broadcast]: https://docs.rs/tokio/1/tokio/sync/broadcast/index.html
[watch]: https://docs.rs/tokio/1/tokio/sync/watch/index.html
[`async-channel`]: https://docs.rs/async-channel/
[`std::sync::mpsc`]: https://doc.rust-lang.org/stable/std/sync/mpsc/index.html
[`crossbeam::channel`]: https://docs.rs/crossbeam/latest/crossbeam/channel/index.html

## 背压（Backpressure）

背压是一种设计应用程序的模式，使其能够很好地响应高负载。例如，`mpsc` 通道有有界和无界两种形式。通过使用有界通道，如果接收者跟不上消息数量，接收者可以对发送者施加"背压"，这避免了随着通道上发送越来越多的消息而内存使用量无限增长。

## Actor

设计应用程序的设计模式。Actor 指的是一个独立生成的任务，代表应用程序的其他部分管理某些资源，使用通道与应用程序的其他部分通信。

参见[通道章节]获取 actor 的示例。

[通道章节]: /tokio/tutorial/channels