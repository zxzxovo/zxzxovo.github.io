# 与同步代码桥接

在使用 Tokio 的大多数示例中，我们用 `#[tokio::main]` 标记主函数，并使整个项目异步。

在某些情况下，您可能需要运行一小部分同步代码。有关更多信息，请参阅 [`spawn_blocking`]。

在其他情况下，将应用程序结构化为主要同步，只有较小或逻辑上不同的异步部分可能更容易。例如，GUI 应用程序可能希望在主线程上运行 GUI 代码，并在另一个线程上并行运行 Tokio 运行时。

本页面解释了如何将 async/await 隔离到项目的一小部分。

## `#[tokio::main]` 展开的内容

`#[tokio::main]` 宏是一个将您的主函数替换为非异步主函数的宏，该函数启动一个运行时，然后调用您的代码。例如，这样：
```rust
#[tokio::main]
async fn main() {
    println!("Hello world");
}
```
被宏转换成这样：
```rust
fn main() {
    tokio::runtime::Builder::new_multi_thread()
        .enable_all()
        .build()
        .unwrap()
        .block_on(async {
            println!("Hello world");
        })
}
```
为了在我们自己的项目中使用 async/await，我们可以做类似的事情，在适当的地方利用 [`block_on`] 方法进入异步上下文。

## mini-redis 的同步接口

在本节中，我们将介绍如何通过存储 `Runtime` 对象并使用其 `block_on` 方法来构建 mini-redis 的同步接口。在接下来的部分中，我们将讨论一些替代方法以及何时使用每种方法。

我们将要包装的接口是异步 [`Client`] 类型。它有几个方法，我们将实现以下方法的阻塞版本：

 * [`Client::get`]
 * [`Client::set`]
 * [`Client::set_expires`]
 * [`Client::publish`]
 * [`Client::subscribe`]

为此，我们引入一个名为 `src/clients/blocking_client.rs` 的新文件，并用围绕异步 `Client` 类型的包装器结构初始化它：
```rs
use tokio::net::ToSocketAddrs;
use tokio::runtime::Runtime;

pub use crate::clients::client::Message;

/// 与 Redis 服务器的已建立连接。
pub struct BlockingClient {
    /// 异步 `Client`。
    inner: crate::clients::Client,

    /// 用于以阻塞方式在异步客户端上执行操作的 `current_thread` 运行时。
    rt: Runtime,
}

impl BlockingClient {
    pub fn connect<T: ToSocketAddrs>(addr: T) -> crate::Result<BlockingClient> {
        let rt = tokio::runtime::Builder::new_current_thread()
            .enable_all()
            .build()?;        // 使用运行时调用异步连接方法。
        let inner = rt.block_on(crate::clients::Client::connect(addr))?;

        Ok(BlockingClient { inner, rt })
    }
}
```
在这里，我们包含了构造函数作为如何在非异步上下文中执行异步方法的第一个示例。我们使用 Tokio [`Runtime`] 类型上的 [`block_on`] 方法来做到这一点，该方法执行异步方法并返回其结果。

一个重要的细节是使用 [`current_thread`] 运行时。通常在使用 Tokio 时，您会使用默认的 [`multi_thread`] 运行时，它会生成一堆后台线程，以便能够高效地同时运行许多事情。对于我们的用例，我们一次只做一件事，所以运行多个线程不会获得任何好处。这使得
time, so we won't gain anything by running multiple threads. This makes the
[`current_thread`] 运行时非常适合，因为它不会生成任何线程。

[`enable_all`] 调用在 Tokio 运行时上启用 IO 和定时器驱动程序。如果未启用它们，运行时将无法执行 IO 或定时器操作。

> **警告**
> 因为 `current_thread` 运行时不生成线程，它只在调用 `block_on` 时操作。一旦 `block_on` 返回，该运行时上所有生成的任务将冻结，直到您再次调用 `block_on`。如果生成的任务在不调用 `block_on` 时必须继续运行，请使用 `multi_threaded` 运行时。

一旦我们有了这个结构，大多数方法都很容易实现：
```rs
use bytes::Bytes;
use std::time::Duration;

impl BlockingClient {
    pub fn get(&mut self, key: &str) -> crate::Result<Option<Bytes>> {
        self.rt.block_on(self.inner.get(key))
    }

    pub fn set(&mut self, key: &str, value: Bytes) -> crate::Result<()> {
        self.rt.block_on(self.inner.set(key, value))
    }

    pub fn set_expires(
        &mut self,
        key: &str,
        value: Bytes,
        expiration: Duration,
    ) -> crate::Result<()> {
        self.rt.block_on(self.inner.set_expires(key, value, expiration))
    }

    pub fn publish(&mut self, channel: &str, message: Bytes) -> crate::Result<u64> {
        self.rt.block_on(self.inner.publish(channel, message))
    }
}
```
[`Client::subscribe`] 方法更有趣，因为它将 `Client` 转换为 `Subscriber` 对象。我们可以通过以下方式实现它：
```rs
/// 进入发布/订阅模式的客户端。
///
/// 一旦客户端订阅了通道，它们只能执行发布/订阅相关的命令。
/// `BlockingClient` 类型被转换为 `BlockingSubscriber` 类型，
/// 以防止调用非发布/订阅方法。
pub struct BlockingSubscriber {
    /// 异步 `Subscriber`。
    inner: crate::clients::Subscriber,

    /// 用于以阻塞方式在异步客户端上执行操作的 `current_thread` 运行时。
    rt: Runtime,
}

impl BlockingClient {
    pub fn subscribe(self, channels: Vec<String>) -> crate::Result<BlockingSubscriber> {
        let subscriber = self.rt.block_on(self.inner.subscribe(channels))?;
        Ok(BlockingSubscriber {
            inner: subscriber,
            rt: self.rt,
        })
    }
}

impl BlockingSubscriber {
    pub fn get_subscribed(&self) -> &[String] {
        self.inner.get_subscribed()
    }

    pub fn next_message(&mut self) -> crate::Result<Option<Message>> {
        self.rt.block_on(self.inner.next_message())
    }

    pub fn subscribe(&mut self, channels: &[String]) -> crate::Result<()> {
        self.rt.block_on(self.inner.subscribe(channels))
    }

    pub fn unsubscribe(&mut self, channels: &[String]) -> crate::Result<()> {
        self.rt.block_on(self.inner.unsubscribe(channels))
    }
}
```
所以，`subscribe` 方法将首先使用运行时将异步 `Client` 转换为异步 `Subscriber`。然后，它将把生成的 `Subscriber` 与 `Runtime` 一起存储，并使用 [`block_on`] 实现各种方法。

注意异步 `Subscriber` 结构有一个名为 `get_subscribed` 的非异步方法。为了处理这个，我们只是直接调用它，而不涉及运行时。

## 其他方法

上面的部分解释了实现同步包装器的最简单方法，但这不是唯一的方法。这些方法是：

  * 创建一个 [`Runtime`] 并在异步代码上调用 [`block_on`]。
 * 创建一个 [`Runtime`] 并在其上 [`spawn`] 任务。
 * 在单独的线程中运行 [`Runtime`] 并向其发送消息。

我们已经看到了第一种方法。下面概述了另外两种方法。

### 在运行时上生成任务

[`Runtime`] 对象有一个名为 [`spawn`] 的方法。当您调用此方法时，您会创建一个新的后台任务在运行时上运行。例如：
```rust
use tokio::runtime::Builder;
use tokio::time::{sleep, Duration};

fn main() {
    let runtime = Builder::new_multi_thread()
        .worker_threads(1)
        .enable_all()
        .build()
        .unwrap();

    let mut handles = Vec::with_capacity(10);
    for i in 0..10 {
        handles.push(runtime.spawn(my_bg_task(i)));
    }    // 在后台任务执行时做一些耗时的事情。
    std::thread::sleep(Duration::from_millis(750));
    println!("Finished time-consuming task.");

    // 等待所有任务完成。
    for handle in handles {
        // `spawn` 方法返回一个 `JoinHandle`。`JoinHandle` 是一个 future，
        // 所以我们可以使用 `block_on` 等待它。
        runtime.block_on(handle).unwrap();
    }
}

async fn my_bg_task(i: u64) {
    // 通过减法，具有较大 i 值的任务睡眠时间较短。
    let millis = 1000 - 50 * i;
    println!("Task {} sleeping for {} ms.", i, millis);

    sleep(Duration::from_millis(millis)).await;

    println!("Task {} stopping.", i);
}
```
```text
Task 0 sleeping for 1000 ms.
Task 1 sleeping for 950 ms.
Task 2 sleeping for 900 ms.
Task 3 sleeping for 850 ms.
Task 4 sleeping for 800 ms.
Task 5 sleeping for 750 ms.
Task 6 sleeping for 700 ms.
Task 7 sleeping for 650 ms.
Task 8 sleeping for 600 ms.
Task 9 sleeping for 550 ms.
Task 9 stopping.
Task 8 stopping.
Task 7 stopping.
Task 6 stopping.
Finished time-consuming task.
Task 5 stopping.
Task 4 stopping.
Task 3 stopping.
Task 2 stopping.
Task 1 stopping.
Task 0 stopping.
```
在上面的示例中，我们在运行时上生成了 10 个后台任务，然后等待所有任务完成。作为示例，这可能是在图形应用程序中实现后台网络请求的好方法，因为网络请求在主 GUI 线程上运行太耗时。相反，您在后台运行的 Tokio 运行时上生成请求，并在请求完成时让任务将信息发送回 GUI 代码，甚至如果您想要进度条的话，也可以增量发送。

在这个示例中，重要的是运行时被配置为 [`multi_thread`] 运行时。如果您将其更改为 [`current_thread`] 运行时，您会发现耗时任务在任何后台任务开始之前就完成了。这是因为在 `current_thread` 运行时上生成的后台任务只会在调用 `block_on` 期间执行，因为运行时没有其他地方可以运行它们。

该示例通过在 [`spawn`] 调用返回的 [`JoinHandle`] 上调用 `block_on` 来等待生成的任务完成，但这不是唯一的方法。以下是一些替代方案：

 * 使用消息传递通道，如 [`tokio::sync::mpsc`]。
 * 修改由例如 `Mutex` 保护的共享值。这对于 GUI 中的进度条来说可能是一个好方法，其中 GUI 每帧读取共享值。

`spawn` 方法在 [`Handle`] 类型上也可用。`Handle` 类型可以被克隆以获得运行时的多个句柄，每个 `Handle` 都可以用于在运行时上生成新任务。

### 发送消息

第三种技术是生成一个运行时并使用消息传递与其通信。这比其他两种方法涉及更多的样板代码，但它是最灵活的方法。您可以在下面找到一个基本示例：

```rust
use tokio::runtime::Builder;
use tokio::sync::mpsc;

pub struct Task {
    name: String,
    // 描述任务的信息
}

async fn handle_task(task: Task) {
    println!("Got task {}", task.name);
}

#[derive(Clone)]
pub struct TaskSpawner {
    spawn: mpsc::Sender<Task>,
}

impl TaskSpawner {
    pub fn new() -> TaskSpawner {
        // 设置用于通信的通道。
        let (send, mut recv) = mpsc::channel(16);

        // 为新线程构建运行时。
        //
        // 运行时在生成线程之前创建，以便在 `unwrap()` 出现 panic 时
        // 更干净地转发错误。
        let rt = Builder::new_current_thread()
            .enable_all()
            .build()
            .unwrap();

        std::thread::spawn(move || {
            rt.block_on(async move {
                while let Some(task) = recv.recv().await {
                    tokio::spawn(handle_task(task));
                }

                // 一旦所有发送者超出作用域，
                // `.recv()` 调用返回 None，它将
                // 从 while 循环退出并关闭线程。
            });
        });

        TaskSpawner {
            spawn: send,
        }
    }    pub fn spawn_task(&self, task: Task) {
        match self.spawn.blocking_send(task) {
            Ok(()) => {},
            Err(_) => panic!("The shared runtime has shut down."),
        }
    }
}
```
这个示例可以通过多种方式配置。例如，您可以使用 [`Semaphore`] 来限制活动任务的数量，或者您可以使用相反方向的通道向生成器发送响应。当您以这种方式生成运行时时，它是一种[actor]。

[`Runtime`]: https://docs.rs/tokio/1/tokio/runtime/struct.Runtime.html
[`block_on`]: https://docs.rs/tokio/1/tokio/runtime/struct.Runtime.html#method.block_on
[`spawn`]: https://docs.rs/tokio/1/tokio/runtime/struct.Runtime.html#method.spawn
[`spawn_blocking`]: https://docs.rs/tokio/1/tokio/task/fn.spawn_blocking.html
[`multi_thread`]: https://docs.rs/tokio/1/tokio/runtime/struct.Builder.html#method.new_multi_thread
[`current_thread`]: https://docs.rs/tokio/1/tokio/runtime/struct.Builder.html#method.new_current_thread
[`enable_all`]: https://docs.rs/tokio/1/tokio/runtime/struct.Builder.html#method.enable_all
[`JoinHandle`]: https://docs.rs/tokio/1/tokio/task/struct.JoinHandle.html
[`tokio::sync::mpsc`]: https://docs.rs/tokio/1/tokio/sync/mpsc/index.html
[`Handle`]: https://docs.rs/tokio/1/tokio/runtime/struct.Handle.html
[`Semaphore`]: https://docs.rs/tokio/1/tokio/sync/struct.Semaphore.html
[`Client`]: https://docs.rs/mini-redis/0.4/mini_redis/client/struct.Client.html
[`Client::get`]: https://docs.rs/mini-redis/0.4/mini_redis/client/struct.Client.html#method.get
[`Client::set`]: https://docs.rs/mini-redis/0.4/mini_redis/client/struct.Client.html#method.set
[`Client::set_expires`]: https://docs.rs/mini-redis/0.4/mini_redis/client/struct.Client.html#method.set_expires
[`Client::publish`]: https://docs.rs/mini-redis/0.4/mini_redis/client/struct.Client.html#method.publish
[`Client::subscribe`]: https://docs.rs/mini-redis/0.4/mini_redis/client/struct.Client.html#method.subscribe
[actor]: https://ryhl.io/blog/actors-with-tokio/