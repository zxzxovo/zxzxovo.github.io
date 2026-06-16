# 深入异步

到此为止，我们已经完成了对异步 Rust 和 Tokio 相当全面的介绍。现在我们将深入挖掘 Rust 的异步运行时模型。在教程的最开始，我们暗示异步 Rust 采用了独特的方法。现在，我们来解释这意味着什么。

## Futures

作为快速回顾，让我们看一个非常基本的异步函数。与教程到目前为止涵盖的内容相比，这没有什么新的。

```rust
use tokio::net::TcpStream;

async fn my_async_fn() {
    println!("来自异步的问候");
    let _socket = TcpStream::connect("127.0.0.1:3000").await.unwrap();
    println!("异步 TCP 操作完成");
}
```

我们调用函数，它返回某个值。我们对该值调用 `.await`。

```rust
# async fn my_async_fn() {}
#[tokio::main]
async fn main() {
    let what_is_this = my_async_fn();
    // 还没有打印任何内容。
    what_is_this.await;
    // 文本已被打印，套接字已被
    // 建立和关闭。
}
```

`my_async_fn()` 返回的值是一个 future。future 是一个实现了标准库提供的 [`std::future::Future`][trait] trait 的值。它们是包含进行中的异步计算的值。

[`std::future::Future`][trait] trait 定义是：

```rust
use std::pin::Pin;
use std::task::{Context, Poll};

pub trait Future {
    type Output;

    fn poll(self: Pin<&mut Self>, cx: &mut Context)
        -> Poll<Self::Output>;
}
```

[关联类型][assoc] `Output` 是 future 完成后产生的类型。[`Pin`][pin] 类型是 Rust 能够在 `async` 函数中支持借用的方式。有关更多详细信息，请参阅[标准库][pin]文档。

与其他语言中 futures 的实现方式不同，Rust future 不代表在后台发生的计算，而是 Rust future **就是**计算本身。future 的所有者负责通过轮询 future 来推进计算。这是通过调用 `Future::poll` 来完成的。

### 实现 `Future`

让我们实现一个非常简单的 future。这个 future 将：

1. 等待到特定的时间点。
2. 向 STDOUT 输出一些文本。
3. 产生一个字符串。

```rust
use std::future::Future;
use std::pin::Pin;
use std::task::{Context, Poll};
use std::time::{Duration, Instant};

struct Delay {
    when: Instant,
}

impl Future for Delay {
    type Output = &'static str;

    fn poll(self: Pin<&mut Self>, cx: &mut Context<'_>)
        -> Poll<&'static str>
    {        if Instant::now() >= self.when {
            println!("Hello world");
            Poll::Ready("done")
        } else {
            // 现在忽略这一行。
            cx.waker().wake_by_ref();
            Poll::Pending
        }
    }
}

#[tokio::main]
async fn main() {
    let when = Instant::now() + Duration::from_millis(10);
    let future = Delay { when };

    let out = future.await;
    assert_eq!(out, "done");
}
```

### Async fn 作为 Future

在 main 函数中，我们实例化 future 并对其调用 `.await`。从异步函数中，我们可以对任何实现 `Future` 的值调用 `.await`。反过来，调用 `async` 函数返回一个实现 `Future` 的匿名类型。在 `async fn main()` 的情况下，生成的 future 大致是：

```rust
use std::future::Future;
use std::pin::Pin;
use std::task::{Context, Poll};
use std::time::{Duration, Instant};

enum MainFuture {
    // 已初始化，从未轮询过
    State0,
    // 等待 `Delay`，即 `future.await` 行。
    State1(Delay),
    // future 已完成。
    Terminated,
}
# struct Delay { when: Instant };
# impl Future for Delay {
#     type Output = &'static str;
#     fn poll(self: Pin<&mut Self>, _: &mut Context<'_>) -> Poll<&'static str> {
#         unimplemented!();
#     }
# }

impl Future for MainFuture {
    type Output = ();

    fn poll(mut self: Pin<&mut Self>, cx: &mut Context<'_>)
        -> Poll<()>
    {
        use MainFuture::*;

        loop {
            match *self {
                State0 => {
                    let when = Instant::now() +
                        Duration::from_millis(10);
                    let future = Delay { when };
                    *self = State1(future);
                }
                State1(ref mut my_future) => {
                    match Pin::new(my_future).poll(cx) {                        Poll::Ready(out) => {
                            assert_eq!(out, "done");
                            *self = Terminated;
                            return Poll::Ready(());
                        }
                        Poll::Pending => {
                            return Poll::Pending;
                        }
                    }
                }                Terminated => {
                    panic!("future polled after completion")
                }
            }
        }
    }
}
```

Rust futures 是**状态机**。这里，`MainFuture` 被表示为 future 可能状态的 `enum`。future 从 `State0` 状态开始。当调用 `poll` 时，future 尝试尽可能地推进其内部状态。如果 future 能够完成，则返回包含异步计算输出的 `Poll::Ready`。

如果 future **无法**完成，通常是由于它等待的资源尚未准备好，则返回 `Poll::Pending`。接收 `Poll::Pending` 向调用者表明 future 将在稍后完成，调用者应该稍后再次调用 `poll`。

我们还看到 futures 由其他 futures 组成。在外部 future 上调用 `poll` 会导致调用内部 future 的 `poll` 函数。

## 执行器

异步 Rust 函数返回 futures。必须在 futures 上调用 `poll` 来推进它们的状态。Futures 由其他 futures 组成。那么，问题是，什么会在最外层的 future 上调用 `poll`？

回想之前，要运行异步函数，它们必须要么传递给 `tokio::spawn`，要么是用 `#[tokio::main]` 注解的主函数。这会导致将生成的外部 future 提交给 Tokio 执行器。执行器负责在外部 future 上调用 `Future::poll`，驱动异步计算直到完成。

### Mini Tokio

为了更好地理解这一切是如何结合在一起的，让我们实现自己的 Tokio 最小版本！完整代码可以在[这里][mini-tokio]找到。

```rust
use std::collections::VecDeque;
use std::future::Future;
use std::pin::Pin;
use std::task::{Context, Poll};
use std::time::{Duration, Instant};
use futures::task;

fn main() {
    let mut mini_tokio = MiniTokio::new();

    mini_tokio.spawn(async {
        let when = Instant::now() + Duration::from_millis(10);
        let future = Delay { when };

        let out = future.await;
        assert_eq!(out, "done");
    });

    mini_tokio.run();
}
# struct Delay { when: Instant }
# impl Future for Delay {
#     type Output = &'static str;
#     fn poll(self: Pin<&mut Self>, _: &mut Context<'_>) -> Poll<&'static str> {
#         Poll::Ready("done")
#     }
# }

struct MiniTokio {
    tasks: VecDeque<Task>,
}

type Task = Pin<Box<dyn Future<Output = ()> + Send>>;

impl MiniTokio {
    fn new() -> MiniTokio {
        MiniTokio {
            tasks: VecDeque::new(),
        }    }

    /// 在 mini-tokio 实例上生成一个 future。
    fn spawn<F>(&mut self, future: F)
    where
        F: Future<Output = ()> + Send + 'static,
    {
        self.tasks.push_back(Box::pin(future));
    }

    fn run(&mut self) {
        let waker = task::noop_waker();
        let mut cx = Context::from_waker(&waker);

        while let Some(mut task) = self.tasks.pop_front() {
            if task.as_mut().poll(&mut cx).is_pending() {
                self.tasks.push_back(task);
            }
        }
    }
}
```

这运行了异步块。创建了一个 `Delay` 实例，具有请求的延迟时间，并在其上等待。然而，到目前为止我们的实现有一个主要**缺陷**。我们的执行器从不进入睡眠状态。执行器持续循环**所有**生成的 futures 并轮询它们。大多数时候，futures 将不准备执行更多工作，并将再次返回 `Poll::Pending`。该过程将消耗 CPU 周期，通常不会很高效。

理想情况下，我们希望 mini-tokio 只在 future 能够取得进展时才轮询 futures。这发生在任务被阻塞的资源变为可以执行请求的操作时。如果任务想要从 TCP 套接字读取数据，那么我们只想在 TCP 套接字接收到
data. In our case, the task is blocked on the given `Instant` being reached.
Ideally, mini-tokio would only poll the task once that instant in time has
passed.

To achieve this, when a resource is polled, and the resource is **not** ready,
the resource will send a notification once it transitions into a ready state.

## Wakers

Wakers are the missing piece. This is the system by which a resource is able to
notify the waiting task that the resource has become ready to continue some
operation.

Let's look at the `Future::poll` definition again:

```rust,compile_fail
fn poll(self: Pin<&mut Self>, cx: &mut Context)
    -> Poll<Self::Output>;
```

`poll` 的 `Context` 参数有一个 `waker()` 方法。此方法返回绑定到当前任务的 [`Waker`]。[`Waker`] 有一个 `wake()` 方法。调用此方法向执行器发出信号，表示关联的任务应该被调度执行。资源在转换为就绪状态时调用 `wake()` 来通知执行器轮询任务将能够取得进展。

### 更新 `Delay`

我们可以更新 `Delay` 以使用 wakers：

```rust
use std::future::Future;
use std::pin::Pin;
use std::task::{Context, Poll};
use std::time::{Duration, Instant};
use std::thread;

struct Delay {
    when: Instant,
}

impl Future for Delay {
    type Output = &'static str;

    fn poll(self: Pin<&mut Self>, cx: &mut Context<'_>)
        -> Poll<&'static str>
    {
        if Instant::now() >= self.when {
            println!("Hello world");
            Poll::Ready("done")        } else {
            // 获取当前任务的 waker 句柄
            let waker = cx.waker().clone();
            let when = self.when;

            // 生成一个计时器线程。
            thread::spawn(move || {
                let now = Instant::now();

                if now < when {
                    thread::sleep(when - now);
                }

                waker.wake();
            });

            Poll::Pending
        }
    }
}
```

现在，一旦请求的持续时间过去，调用任务就会收到通知，执行器可以确保任务再次被调度。下一步是更新 mini-tokio 以监听唤醒通知。

我们的 `Delay` 实现仍然存在一些问题。我们稍后会修复它们。

> **警告**
> 当 future 返回 `Poll::Pending` 时，它**必须**确保在某个时刻发出 waker 信号。忘记这样做会导致任务无限期挂起。
>
> 在返回 `Poll::Pending` 后忘记唤醒任务是一个常见的错误来源。

回想 `Delay` 的第一次迭代。这是 future 实现：

```rust
# use std::future::Future;
# use std::pin::Pin;
# use std::task::{Context, Poll};
# use std::time::Instant;
# struct Delay { when: Instant }
impl Future for Delay {
    type Output = &'static str;

    fn poll(self: Pin<&mut Self>, cx: &mut Context<'_>)
        -> Poll<&'static str>
    {
        if Instant::now() >= self.when {
            println!("Hello world");
            Poll::Ready("done")        } else {
            // 现在忽略这一行。
            cx.waker().wake_by_ref();
            Poll::Pending
        }
    }
}
```

在返回 `Poll::Pending` 之前，我们调用了 `cx.waker().wake_by_ref()`。这是为了满足 future 约定。通过返回 `Poll::Pending`，我们有责任发出 waker 信号。因为我们还没有实现计时器线程，所以我们内联发出 waker 信号。这样做会导致 future 立即被重新调度、再次执行，并且可能仍然没有准备好完成。

请注意，您可以比必要的更频繁地发出 waker 信号。在这种特殊情况下，即使我们完全没有准备好继续操作，我们也会发出 waker 信号。除了浪费一些 CPU 周期外，这样做没有什么问题。然而，这种特殊的实现会导致忙循环。

### 更新 Mini Tokio

下一步是更新 Mini Tokio 以接收 waker 通知。我们希望执行器只在任务被唤醒时运行任务，为了做到这一点，Mini Tokio 将提供自己的 waker。当 waker 被调用时，其关联的任务被排队执行。Mini-Tokio 在轮询 future 时将此 waker 传递给 future。

更新后的 Mini Tokio 将使用通道来存储调度的任务。通道允许任务从任何线程排队执行。Wakers 必须是 `Send` 和 `Sync`。

> **信息**
> `Send` 和 `Sync` traits 是 Rust 提供的与并发性相关的标记 traits。可以**发送**到不同线程的类型是 `Send`。大多数类型都是 `Send`，但像 [`Rc`] 这样的类型不是。可以通过不可变引用**并发**访问的类型是 `Sync`。一个类型可以是 `Send` 但不是 `Sync` —— 一个很好的例子是 [`Cell`]，它可以通过不可变引用修改，因此并发访问是不安全的。
>
> 有关更多详细信息，请参阅 Rust 书中的相关[章节][ch]。

[`Rc`]: https://doc.rust-lang.org/std/rc/struct.Rc.html
[`Cell`]: https://doc.rust-lang.org/std/cell/struct.Cell.html
[ch]: https://doc.rust-lang.org/book/ch16-04-extensible-concurrency-sync-and-send.html

更新 `MiniTokio` 结构体。

```rust
use std::sync::mpsc;
use std::sync::Arc;

struct MiniTokio {
    scheduled: mpsc::Receiver<Arc<Task>>,
    sender: mpsc::Sender<Arc<Task>>,
}

struct Task {
    // 这将很快被填充。
}
```

Wakers 是 `Sync` 的并且可以被克隆。当调用 `wake` 时，任务必须被调度执行。为了实现这一点，我们有一个通道。当在 waker 上调用 `wake()` 时，任务被推入通道的发送端。我们的 `Task` 结构将实现唤醒逻辑。为了做到这一点，它需要包含生成的 future 和通道发送端。我们将 future 放在 `TaskFuture` 结构中，与 `Poll` 枚举一起跟踪最新的 `Future::poll()` 结果，这是处理虚假唤醒所需的。更多细节在 `TaskFuture` 中 `poll()` 方法的实现中给出。

```rust
# use std::future::Future;
# use std::pin::Pin;
# use std::sync::mpsc;
# use std::task::Poll;
use std::sync::{Arc, Mutex};

/// 一个持有 future 和其 `poll` 方法最新
/// 调用结果的结构。
struct TaskFuture {
    future: Pin<Box<dyn Future<Output = ()> + Send>>,
    poll: Poll<()>,
}

struct Task {
    // `Mutex` 是为了让 `Task` 实现 `Sync`。只有
    // 一个线程在任何给定时间访问 `task_future`。
    // `Mutex` 对于正确性不是必需的。真正的 Tokio
    // 在这里不使用互斥锁，但真正的 Tokio 有
    // 比单个教程页面能容纳的更多代码行。
    task_future: Mutex<TaskFuture>,
    executor: mpsc::Sender<Arc<Task>>,
}

impl Task {
    fn schedule(self: &Arc<Self>) {
        self.executor.send(self.clone());
    }
}
```

为了调度任务，`Arc` 被克隆并通过通道发送。现在，我们需要将我们的 `schedule` 函数与 [`std::task::Waker`][`Waker`] 连接起来。标准库提供了一个低级 API 来使用[手动 vtable 构造][vtable]来做到这一点。这种策略为实现者提供了最大的灵活性，但需要大量不安全的样板代码。我们将使用 [`futures`] crate 提供的 [`ArcWake`] 实用程序，而不是直接使用 [`RawWakerVTable`][vtable]。这允许我们实现一个简单的 trait 来将我们的 `Task` 结构暴露为 waker。

将以下依赖项添加到您的 `Cargo.toml` 以引入 `futures`。

```toml
futures = "0.3"
```

然后实现 [`futures::task::ArcWake`][`ArcWake`]。

```rust
use futures::task::{self, ArcWake};
use std::sync::Arc;
# struct Task {}
# impl Task {
#     fn schedule(self: &Arc<Self>) {}
# }
impl ArcWake for Task {
    fn wake_by_ref(arc_self: &Arc<Self>) {
        arc_self.schedule();
    }
}
```

当上面的计时器线程调用 `waker.wake()` 时，任务被推入通道。接下来，我们实现在 `MiniTokio::run()` 函数中接收和执行任务。

```rust
# use std::sync::mpsc;
# use futures::task::{self, ArcWake};
# use std::future::Future;
# use std::pin::Pin;
# use std::sync::{Arc, Mutex};
# use std::task::{Context, Poll};
# struct MiniTokio {
#   scheduled: mpsc::Receiver<Arc<Task>>,
#   sender: mpsc::Sender<Arc<Task>>,
# }
# struct TaskFuture {
#     future: Pin<Box<dyn Future<Output = ()> + Send>>,
#     poll: Poll<()>,
# }
# struct Task {
#   task_future: Mutex<TaskFuture>,
#   executor: mpsc::Sender<Arc<Task>>,
# }
# impl ArcWake for Task {
#   fn wake_by_ref(arc_self: &Arc<Self>) {}
# }
impl MiniTokio {
    fn run(&self) {
        while let Ok(task) = self.scheduled.recv() {
            task.poll();
        }
    }    /// 初始化一个新的 mini-tokio 实例。
    fn new() -> MiniTokio {
        let (sender, scheduled) = mpsc::channel();

        MiniTokio { scheduled, sender }
    }

    /// 在 mini-tokio 实例上生成一个 future。
    ///
    /// 给定的 future 被包装在 `Task` 装置中并推入
    /// `scheduled` 队列。当调用 `run` 时，future 将被执行。
    fn spawn<F>(&self, future: F)
    where
        F: Future<Output = ()> + Send + 'static,
    {
        Task::spawn(future, &self.sender);
    }
}

impl TaskFuture {
    fn new(future: impl Future<Output = ()> + Send + 'static) -> TaskFuture {
        TaskFuture {
            future: Box::pin(future),
            poll: Poll::Pending,
        }
    }    fn poll(&mut self, cx: &mut Context<'_>) {
        // 虚假唤醒是允许的，即使在 future 已经
        // 返回 `Ready` 之后。然而，轮询已经
        // 返回 `Ready` 的 future 是*不*允许的。因此
        // 我们需要检查 future 仍然是 pending
        // 才调用它。不这样做可能导致 panic。
        if self.poll.is_pending() {
            self.poll = self.future.as_mut().poll(cx);
        }
    }
}

impl Task {
    fn poll(self: Arc<Self>) {
        // 从 `Task` 实例创建一个 waker。这
        // 使用上面的 `ArcWake` 实现。
        let waker = task::waker(self.clone());
        let mut cx = Context::from_waker(&waker);

        // 没有其他线程试图锁定 task_future
        let mut task_future = self.task_future.try_lock().unwrap();

        // 轮询内部 future
        task_future.poll(&mut cx);
    }

    // 用给定的 future 生成一个新任务。
    //
    // 初始化一个包含给定 future 的新 Task 装置并将其推入
    // `sender`。通道的接收端将获取任务并
    // 执行它。
    fn spawn<F>(future: F, sender: &mpsc::Sender<Arc<Task>>)
    where
        F: Future<Output = ()> + Send + 'static,
    {
        let task = Arc::new(Task {
            task_future: Mutex::new(TaskFuture::new(future)),
            executor: sender.clone(),
        });

        let _ = sender.send(task);
    }
}
```

这里发生了多件事。首先，实现了 `MiniTokio::run()`。该函数在循环中运行，从通道接收调度的任务。当任务被唤醒时，它们被推入通道，这些任务在执行时能够取得进展。

此外，`MiniTokio::new()` 和 `MiniTokio::spawn()` 函数被调整为使用通道而不是 `VecDeque`。当新任务被生成时，它们获得通道发送端的克隆，任务可以使用它在运行时调度自己。

`Task::poll()` 函数使用 `futures` crate 的 [`ArcWake`] 实用程序创建 waker。waker 用于创建 `task::Context`。然后将该 `task::Context` 传递给 `poll`。

## 总结

我们现在已经看到了异步 Rust 如何工作的端到端示例。Rust 的 `async/await` 功能由 traits 支持。这允许第三方 crates（如 Tokio）提供执行细节。

* 异步 Rust 操作是惰性的，需要调用者轮询它们。
* Wakers 被传递给 futures 以将 future 链接到调用它的任务。
* 当资源**尚未**准备好完成操作时，返回 `Poll::Pending` 并记录任务的 waker。
* 当资源变为就绪时，任务的 waker 被通知。
* 执行器接收通知并调度任务执行。
* 任务再次被轮询，这次资源已准备好，任务取得进展。

## 一些遗留问题

回想我们实现 `Delay` future 时，我们说有一些事情需要修复。Rust 的异步模型允许单个 future 在执行时跨任务迁移。考虑以下内容：

```rust
use futures::future::poll_fn;
use std::future::Future;
use std::pin::Pin;
# use std::task::{Context, Poll};
# use std::time::{Duration, Instant};
# struct Delay { when: Instant }
# impl Future for Delay {
#   type Output = ();
#   fn poll(self: Pin<&mut Self>, _cx: &mut Context<'_>) -> Poll<()> {
#       Poll::Pending
#   }
# }

#[tokio::main]
async fn main() {
    let when = Instant::now() + Duration::from_millis(10);
    let mut delay = Some(Delay { when });

    poll_fn(move |cx| {
        let mut delay = delay.take().unwrap();
        let res = Pin::new(&mut delay).poll(cx);
        assert!(res.is_pending());
        tokio::spawn(async move {
            delay.await;
        });

        Poll::Ready(())
    }).await;
}
```

`poll_fn` 函数使用闭包创建一个 `Future` 实例。上面的代码片段创建了一个 `Delay` 实例，轮询它一次，然后将 `Delay` 实例发送到一个新任务中等待。在这个例子中，`Delay::poll` 被用**不同**的 `Waker` 实例调用多次。当这种情况发生时，您必须确保在传递给_最近_一次 `poll` 调用的 `Waker` 上调用 `wake`。

在实现 future 时，假设每次调用 `poll` **可能**提供不同的 `Waker` 实例是至关重要的。poll 函数必须用新的 waker 更新任何先前记录的 waker。

我们早期的 `Delay` 实现每次轮询时都会生成一个新线程。这很好，但如果轮询过于频繁可能会非常低效（例如，如果您在该 future 和其他 future 上使用 `select!`，每当任一有事件时都会轮询两者）。一种方法是记住您是否已经生成了一个线程，只有在尚未生成线程时才生成新线程。但是，如果您这样做，必须确保在后续调用 poll 时更新线程的 `Waker`，因为否则您不会唤醒最新的 `Waker`。

为了修复我们早期的实现，我们可以这样做：

```rust
use std::future::Future;
use std::pin::Pin;
use std::sync::{Arc, Mutex};
use std::task::{Context, Poll, Waker};
use std::thread;
use std::time::{Duration, Instant};

struct Delay {
    when: Instant,
    // 当我们生成了一个线程时这是 Some，否则是 None。
    waker: Option<Arc<Mutex<Waker>>>,
}

impl Future for Delay {
    type Output = ();

    fn poll(mut self: Pin<&mut Self>, cx: &mut Context<'_>) -> Poll<()> {
        // Check the current instant. If the duration has elapsed, then
        // this future has completed so we return `Poll::Ready`.
        if Instant::now() >= self.when {
            return Poll::Ready(());
        }

        // The duration has not elapsed. If this is the first time the future
        // is called, spawn the timer thread. If the timer thread is already
        // running, ensure the stored `Waker` matches the current task's waker.
        if let Some(waker) = &self.waker {
            let mut waker = waker.lock().unwrap();

            // Check if the stored waker matches the current task's waker.
            // This is necessary as the `Delay` future instance may move to
            // a different task between calls to `poll`. If this happens, the
            // waker contained by the given `Context` will differ and we
            // must update our stored waker to reflect this change.
            if !waker.will_wake(cx.waker()) {
                *waker = cx.waker().clone();
            }
        } else {
            let when = self.when;
            let waker = Arc::new(Mutex::new(cx.waker().clone()));
            self.waker = Some(waker.clone());

            // This is the first time `poll` is called, spawn the timer thread.
            thread::spawn(move || {
                let now = Instant::now();

                if now < when {
                    thread::sleep(when - now);
                }

                // The duration has elapsed. Notify the caller by invoking
                // the waker.
                let waker = waker.lock().unwrap();
                waker.wake_by_ref();
            });
        }

        // By now, the waker is stored and the timer thread is started.        // 持续时间还没有过去（回想一下，我们首先检查了这一点），
        // 因此 future 还没有完成，所以我们必须返回 `Poll::Pending`。
        //
        // `Future` trait 约定要求当返回 `Pending` 时，
        // future 确保在应该再次轮询 future 时发出给定的唤醒器信号。
        // 在我们的情况下，通过在这里返回 `Pending`，我们承诺一旦
        // 请求的持续时间过去，我们将调用包含在 `Context` 参数中的
        // 给定唤醒器。我们通过在上面生成定时器线程来确保这一点。
        //
        // 如果我们忘记调用唤醒器，任务将无限期挂起。
        Poll::Pending
    }
}
```

这有点复杂，但思路是，在每次调用 `poll` 时，future 检查提供的唤醒器是否与之前记录的唤醒器匹配。如果两个唤醒器匹配，那么就没有其他事情要做了。如果它们不匹配，那么必须更新记录的唤醒器。

### `Notify` 实用程序

我们演示了如何使用唤醒器手动实现 `Delay` future。唤醒器是异步 Rust 工作原理的基础。通常，没有必要降低到那个级别。例如，在 `Delay` 的情况下，我们可以通过使用 [`tokio::sync::Notify`][notify] 实用程序完全用 `async/await` 来实现它。这个实用程序提供了一个基本的任务通知机制。它处理唤醒器的细节，包括确保记录的唤醒器与当前任务匹配。

使用 [`Notify`][notify]，我们可以像这样使用 `async/await` 实现一个 `delay` 函数：

```rust
use tokio::sync::Notify;
use std::sync::Arc;
use std::time::{Duration, Instant};
use std::thread;

async fn delay(dur: Duration) {
    let when = Instant::now() + dur;
    let notify = Arc::new(Notify::new());
    let notify_clone = notify.clone();

    thread::spawn(move || {
        let now = Instant::now();

        if now < when {
            thread::sleep(when - now);
        }

        notify_clone.notify_one();
    });


    notify.notified().await;
}
```

[assoc]: https://doc.rust-lang.org/book/ch19-03-advanced-traits.html#specifying-placeholder-types-in-trait-definitions-with-associated-types
[trait]: https://doc.rust-lang.org/std/future/trait.Future.html
[pin]: https://doc.rust-lang.org/std/pin/index.html
[`Waker`]: https://doc.rust-lang.org/std/task/struct.Waker.html
[mini-tokio]: https://github.com/tokio-rs/website/blob/master/tutorial-code/mini-tokio/src/main.rs
[vtable]: https://doc.rust-lang.org/std/task/struct.RawWakerVTable.html
[`ArcWake`]: https://docs.rs/futures/0.3/futures/task/trait.ArcWake.html
[`futures`]: https://docs.rs/futures/
[notify]: https://docs.rs/tokio/1/tokio/sync/struct.Notify.html