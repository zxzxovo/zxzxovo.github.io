# 优雅关闭

本页面的目的是概述如何在异步应用程序中正确实现关闭。

实现优雅关闭通常有三个部分：

- 找出何时关闭。
- 告诉程序的每个部分关闭。
- 等待程序的其他部分关闭。

本文的其余部分将介绍这些部分。在 [mini-redis] 中可以找到这里描述的方法的真实世界实现，特别是 [`src/server.rs`][server.rs] 和 [`src/shutdown.rs`][shutdown.rs] 文件。

## 找出何时关闭

这当然取决于应用程序，但一个非常常见的关闭标准是当应用程序从操作系统接收到信号时。这发生在例如当程序运行时您在终端中按 ctrl+c 时。为了检测这一点，Tokio 提供了一个 [`tokio::signal::ctrl_c`][ctrl_c] 函数，它将睡眠直到接收到这样的信号。您可能会这样使用它：

```rs
use tokio::signal;

#[tokio::main]
async fn main() {    // ... 将应用程序作为单独的任务生成 ...

    match signal::ctrl_c().await {
        Ok(()) => {},
        Err(err) => {
            eprintln!("Unable to listen for shutdown signal: {}", err);
            // 在错误情况下我们也会关闭
        },
    }

    // 向应用程序发送关闭信号并等待
}
```

如果您有多个关闭条件，您可以使用 [mpsc 通道][mpsc] 将关闭信号发送到一个地方。然后您可以在 [`ctrl_c`][ctrl_c] 和通道上进行 [select]。例如：

```rs
use tokio::signal;
use tokio::sync::mpsc;

#[tokio::main]
async fn main() {
    let (shutdown_send, mut shutdown_recv) = mpsc::unbounded_channel();    // ... 将应用程序作为单独的任务生成 ...
    //
    // 应用程序在从应用程序内部发出关闭时使用 shutdown_send

    tokio::select! {
        _ = signal::ctrl_c() => {},
        _ = shutdown_recv.recv() => {},
    }

    // 向应用程序发送关闭信号并等待
}
```

## 告诉任务关闭

当您想要告诉一个或多个任务关闭时，您可以使用[取消令牌][cancellation-tokens]。这些令牌允许您通知任务它们应该响应取消请求而终止自己，从而轻松实现优雅关闭。

要在多个任务之间共享 `CancellationToken`，您必须克隆它。这是由于单一所有权规则，该规则要求每个值都有一个单一的所有者。当克隆令牌时，您会得到另一个与原始令牌无法区分的令牌；如果一个被取消，那么另一个也被取消。您可以根据需要制作任意数量的克隆，当您在其中一个上调用 `cancel` 时，它们都会被取消。

以下是在多个任务中使用 `CancellationToken` 的步骤：

1. 首先，创建一个新的 `CancellationToken`。
2. 然后，通过在原始令牌上调用 `clone` 方法来创建原始 `CancellationToken` 的克隆。这将创建一个可供另一个任务使用的新令牌。
3. 将原始或克隆的令牌传递给应该响应取消请求的任务。
4. 当您想要优雅地关闭任务时，在原始或克隆的令牌上调用 `cancel` 方法。任何在原始或克隆令牌上监听取消请求的任务都将收到关闭通知。

以下是展示上述步骤的代码片段：

```rs
// 步骤 1：创建一个新的 CancellationToken
let token = CancellationToken::new();

// 步骤 2：克隆令牌以在另一个任务中使用
let cloned_token = token.clone();

// 任务 1 - 等待令牌取消或长时间
let task1_handle = tokio::spawn(async move {
    tokio::select! {
        // 步骤 3：使用克隆的令牌监听取消请求
        _ = cloned_token.cancelled() => {
            // 令牌被取消，任务可以关闭
        }
        _ = tokio::time::sleep(std::time::Duration::from_secs(9999)) => {
            // 长时间工作已完成
        }
    }
});

// 任务 2 - 在短暂延迟后取消原始令牌
tokio::spawn(async move {
    tokio::time::sleep(std::time::Duration::from_millis(10)).await;

    // 步骤 4：取消原始或克隆的令牌以通知其他任务优雅关闭
    token.cancel();
});

// 等待任务完成
task1_handle.await.unwrap()
```

使用取消令牌，您不必在令牌被取消时立即关闭任务。相反，您可以在终止任务之前运行关闭程序，例如将数据刷新到文件或数据库，或在连接上发送关闭消息。

## 等待任务完成关闭

一旦您告诉其他任务关闭，您需要等待它们完成。一个简单的方法是使用[任务跟踪器][task tracker]。任务跟踪器是一个任务集合。任务跟踪器的 [`wait`] 方法给您一个 future，它只有在其包含的所有 future 都已解决**并且**任务跟踪器已关闭后才会解决。

以下示例将生成 10 个任务，然后使用任务跟踪器等待它们关闭。

```rs
use std::time::Duration;
use tokio::time::sleep;
use tokio_util::task::TaskTracker;

#[tokio::main]
async fn main() {
    let tracker = TaskTracker::new();

    for i in 0..10 {
        tracker.spawn(some_operation(i));
    }    // 一旦我们生成了所有内容，我们就关闭跟踪器。
    tracker.close();

    // 等待所有任务完成。
    tracker.wait().await;

    println!("This is printed after all of the tasks.");
}

async fn some_operation(i: u64) {
    sleep(Duration::from_millis(100 * i)).await;
    println!("Task {} shutting down.", i);
}
```

[ctrl_c]: https://docs.rs/tokio/1/tokio/signal/fn.ctrl_c.html
[task tracker]: https://docs.rs/tokio-util/latest/tokio_util/task/task_tracker
[`wait`]: https://docs.rs/tokio-util/latest/tokio_util/task/task_tracker/struct.TaskTracker.html#method.wait
[select]: https://docs.rs/tokio/1/tokio/macro.select.html
[cancellation-tokens]: https://docs.rs/tokio-util/latest/tokio_util/sync/struct.CancellationToken.html
[shutdown.rs]: https://github.com/tokio-rs/mini-redis/blob/master/src/shutdown.rs
[server.rs]: https://github.com/tokio-rs/mini-redis/blob/master/src/server.rs
[mini-redis]: https://github.com/tokio-rs/mini-redis/
[mpsc]: https://docs.rs/tokio/1/tokio/sync/mpsc/index.html
