# Select

到目前为止，当我们想要为系统添加并发性时，我们生成了一个新任务。现在我们将介绍一些使用 Tokio 并发执行异步代码的其他方法。

## `tokio::select!`

`tokio::select!` 宏允许等待多个异步计算，并在**单个**计算完成时返回。

例如：

```rust
use tokio::sync::oneshot;

#[tokio::main]
async fn main() {
    let (tx1, rx1) = oneshot::channel();
    let (tx2, rx2) = oneshot::channel();

    tokio::spawn(async {
        let _ = tx1.send("one");
    });

    tokio::spawn(async {
        let _ = tx2.send("two");
    });

    tokio::select! {
        val = rx1 => {
            println!("rx1 completed first with {:?}", val);
        }
        val = rx2 => {
            println!("rx2 completed first with {:?}", val);
        }
    }
}
```

使用了两个 oneshot 通道。任一通道都可能首先完成。`select!` 语句等待两个通道，并将 `val` 绑定到任务返回的值。当 `tx1` 或 `tx2` 中的任一个完成时，相关的块将被执行。

**未**完成的分支将被丢弃。在这个例子中，计算等待每个通道的 `oneshot::Receiver`。尚未完成的通道的 `oneshot::Receiver` 将被丢弃。

### 取消

在异步 Rust 中，取消是通过丢弃 future 来执行的。回想一下来自["深入异步"][async]，异步 Rust 操作使用 future 实现，而 future 是惰性的。只有当 future 被轮询时，操作才会进行。如果 future 被丢弃，操作就无法继续，因为所有相关状态都已被丢弃。

也就是说，有时异步操作会生成后台任务或启动在后台运行的其他操作。例如，在上面的例子中，生成了一个任务来发送消息回来。通常，任务会执行一些计算来生成值。

Future 或其他类型可以实现 `Drop` 来清理后台资源。Tokio 的 `oneshot::Receiver` 通过向 `Sender` 半边发送关闭通知来实现 `Drop`。发送端可以接收此通知并通过丢弃正在进行的操作来中止它。

```rust
use tokio::sync::oneshot;

async fn some_operation() -> String {
    // 在这里计算值
# "wut".to_string()
}

#[tokio::main]
async fn main() {
    let (mut tx1, rx1) = oneshot::channel();
    let (tx2, rx2) = oneshot::channel();

    tokio::spawn(async {
        // 在操作和 oneshot 的 `closed()` 通知上选择。
        tokio::select! {
            val = some_operation() => {
                let _ = tx1.send(val);
            }
            _ = tx1.closed() => {
                // `some_operation()` 被取消，
                // 任务完成并且 `tx1` 被丢弃。
            }
        }
    });

    tokio::spawn(async {
        let _ = tx2.send("two");
    });

    tokio::select! {
        val = rx1 => {
            println!("rx1 completed first with {:?}", val);
        }
        val = rx2 => {
            println!("rx2 completed first with {:?}", val);
        }
    }
}
```

[async]: async

### `Future` 实现

为了更好地理解 `select!` 是如何工作的，让我们看看假设的 `Future` 实现会是什么样子。这是一个简化版本。在实践中，`select!` 包含额外的功能，比如随机选择首先轮询的分支。

```rust
use tokio::sync::oneshot;
use std::future::Future;
use std::pin::Pin;
use std::task::{Context, Poll};

struct MySelect {
    rx1: oneshot::Receiver<&'static str>,
    rx2: oneshot::Receiver<&'static str>,
}

impl Future for MySelect {
    type Output = ();

    fn poll(mut self: Pin<&mut Self>, cx: &mut Context<'_>) -> Poll<()> {
        if let Poll::Ready(val) = Pin::new(&mut self.rx1).poll(cx) {
            println!("rx1 completed first with {:?}", val);
            return Poll::Ready(());
        }

        if let Poll::Ready(val) = Pin::new(&mut self.rx2).poll(cx) {
            println!("rx2 completed first with {:?}", val);
            return Poll::Ready(());
        }

        Poll::Pending
    }
}

#[tokio::main]
async fn main() {
    let (tx1, rx1) = oneshot::channel();
    let (tx2, rx2) = oneshot::channel();

    // use tx1 and tx2
# tx1.send("one").unwrap();
# tx2.send("two").unwrap();

    MySelect {
        rx1,
        rx2,
    }.await;
}
```

`MySelect` future 包含来自每个分支的 future。当 `MySelect` 被轮询时，第一个分支被轮询。如果它准备好了，值被使用并且 `MySelect` 完成。在 `.await` 从 future 接收输出后，future 被丢弃。这导致两个分支的 future 都被丢弃。由于一个分支没有完成，操作被有效地取消了。

记住从前面的部分：

> 当 future 返回 `Poll::Pending` 时，它**必须**确保唤醒器在将来的某个时候被发出信号。忘记这样做会导致任务无限期挂起。

在 `MySelect` 实现中没有显式使用 `Context` 参数。相反，通过将 `cx` 传递给内部 future 来满足唤醒器要求。由于内部 future 也必须满足唤醒器要求，通过仅在从内部 future 接收到 `Poll::Pending` 时返回 `Poll::Pending`，`MySelect` 也满足了唤醒器要求。

## 语法

`select!` 宏可以处理超过两个分支。当前限制是 64 个分支。每个分支的结构是：

```text
<pattern> = <async expression> => <handler>,
```

当 `select` 宏被评估时，所有的 `<async expression>` 被聚合并并发执行。当一个表达式完成时，结果与 `<pattern>` 匹配。如果结果匹配模式，那么所有剩余的异步表达式被丢弃，`<handler>` 被执行。`<handler>` 表达式可以访问由 `<pattern>` 建立的任何绑定。

`<pattern>` 的基本情况是一个变量名，异步表达式的结果绑定到变量名，`<handler>` 可以访问该变量。这就是为什么在原始例子中，`val` 用于 `<pattern>`，`<handler>` 能够访问 `val`。

如果 `<pattern>` **不**匹配异步计算的结果，那么剩余的异步表达式继续并发执行，直到下一个完成。在这时，相同的逻辑应用于该结果。

因为 `select!` 接受任何异步表达式，所以可以定义更复杂的计算来进行选择。

这里，我们在 `oneshot` 通道的输出和 TCP 连接上选择。

```rust
use tokio::net::TcpStream;
use tokio::sync::oneshot;

#[tokio::main]
async fn main() {
    let (tx, rx) = oneshot::channel();

    // Spawn a task that sends a message over the oneshot
    tokio::spawn(async move {
        tx.send("done").unwrap();
    });

    tokio::select! {
        socket = TcpStream::connect("localhost:3465") => {
            println!("Socket connected {:?}", socket);
        }
        msg = rx => {
            println!("received message first {:?}", msg);
        }
    }
}
```

Here, we select on a oneshot and accepting sockets from a `TcpListener`.

```rust
use tokio::net::TcpListener;
use tokio::sync::oneshot;
use std::io;

#[tokio::main]
async fn main() -> io::Result<()> {
    let (tx, rx) = oneshot::channel();

    tokio::spawn(async move {
        tx.send(()).unwrap();
    });

    let mut listener = TcpListener::bind("localhost:3465").await?;

    tokio::select! {
        _ = async {
            loop {
                let (socket, _) = listener.accept().await?;
                tokio::spawn(async move { process(socket) });
            }

            // Help the rust type inferencer out
            Ok::<_, io::Error>(())
        } => {}
        _ = rx => {
            println!("terminating accept loop");
        }
    }

    Ok(())
}
# async fn process(_: tokio::net::TcpStream) {}
```

The accept loop runs until an error is encountered or `rx` receives a value. The
`_` pattern indicates that we have no interest in the return value of the async
computation.

## 返回值

`tokio::select!` 宏返回被评估的 `<handler>` 表达式的结果。

```rust
async fn computation1() -> String {
    // .. 计算
# unimplemented!();
}

async fn computation2() -> String {
    // .. 计算
# unimplemented!();
}

# fn dox() {
#[tokio::main]
async fn main() {
    let out = tokio::select! {
        res1 = computation1() => res1,
        res2 = computation2() => res2,
    };

    println!("Got = {}", out);
}
# }
```

因此，要求**每个**分支的 `<handler>` 表达式都评估为相同的类型。如果不需要 `select!` 表达式的输出，好的做法是让表达式评估为 `()`。

## 错误

使用 `?` 操作符从表达式传播错误。这是如何工作的取决于 `?` 是从异步表达式使用还是从处理程序使用。在异步表达式中使用 `?` 将错误传播出异步表达式。这使得异步表达式的输出成为 `Result`。从处理程序使用 `?` 立即将错误传播出 `select!` 表达式。让我们再次查看接受循环示例：

```rust
use tokio::net::TcpListener;
use tokio::sync::oneshot;
use std::io;

#[tokio::main]
async fn main() -> io::Result<()> {
    // [setup `rx` oneshot channel]
# let (tx, rx) = oneshot::channel();
# tx.send(()).unwrap();

    let listener = TcpListener::bind("localhost:3465").await?;

    tokio::select! {
        res = async {
            loop {
                let (socket, _) = listener.accept().await?;
                tokio::spawn(async move { process(socket) });
            }

            // Help the rust type inferencer out
            Ok::<_, io::Error>(())
        } => {
            res?;
        }
        _ = rx => {
            println!("terminating accept loop");
        }
    }

    Ok(())
}
# async fn process(_: tokio::net::TcpStream) {}
```

Notice `listener.accept().await?`. The `?` operator propagates the error out of
that expression and to the `res` binding. On an error, `res` will be set to
`Err(_)`. Then, in the handler, the `?` operator is used again. The `res?`
statement will propagate an error out of the `main` function.

## 模式匹配

回想一下 `select!` 宏分支语法被定义为：

```text
<pattern> = <async expression> => <handler>,
```

到目前为止，我们只对 `<pattern>` 使用了变量绑定。然而，任何 Rust 模式都可以使用。例如，假设我们从多个 MPSC 通道接收，我们可能会做这样的事情：

```rust
use tokio::sync::mpsc;

#[tokio::main]
async fn main() {
    let (mut tx1, mut rx1) = mpsc::channel(128);
    let (mut tx2, mut rx2) = mpsc::channel(128);

    tokio::spawn(async move {
        // 对 `tx1` 和 `tx2` 做一些事情
# tx1.send(1).await.unwrap();
# tx2.send(2).await.unwrap();
    });

    tokio::select! {
        Some(v) = rx1.recv() => {
            println!("Got {:?} from rx1", v);
        }
        Some(v) = rx2.recv() => {
            println!("Got {:?} from rx2", v);
        }
        else => {
            println!("Both channels closed");
        }
    }
}
```

在这个例子中，`select!` 表达式等待从 `rx1` 和 `rx2` 接收值。如果通道关闭，`recv()` 返回 `None`。这**不**匹配模式，分支被禁用。`select!` 表达式将继续等待剩余的分支。

注意这个 `select!` 表达式包含一个 `else` 分支。`select!` 表达式必须评估为一个值。当使用模式匹配时，可能**没有**分支匹配它们相关的模式。如果发生这种情况，`else` 分支被评估。

## 借用

当生成任务时，生成的异步表达式必须拥有其所有数据。`select!` 宏没有这个限制。每个分支的异步表达式可以借用数据并并发操作。遵循 Rust 的借用规则，多个异步表达式可以不可变地借用单个数据片段，**或者**单个异步表达式可以可变地借用数据片段。

让我们看一些例子。这里，我们同时将相同的数据发送到两个不同的 TCP 目标。

```rust
use tokio::io::AsyncWriteExt;
use tokio::net::TcpStream;
use std::io;
use std::net::SocketAddr;

async fn race(
    data: &[u8],
    addr1: SocketAddr,
    addr2: SocketAddr
) -> io::Result<()> {
    tokio::select! {
        Ok(_) = async {
            let mut socket = TcpStream::connect(addr1).await?;
            socket.write_all(data).await?;
            Ok::<_, io::Error>(())
        } => {}
        Ok(_) = async {
            let mut socket = TcpStream::connect(addr2).await?;
            socket.write_all(data).await?;
            Ok::<_, io::Error>(())
        } => {}
        else => {}
    };

    Ok(())
}
# fn main() {}
```

`data` 变量被从两个异步表达式**不可变地**借用。当其中一个操作成功完成时，另一个被丢弃。因为我们在 `Ok(_)` 上模式匹配，如果一个表达式失败，另一个继续执行。

当涉及到每个分支的 `<handler>` 时，`select!` 保证只有一个 `<handler>` 运行。因此，每个 `<handler>` 可以可变地借用相同的数据。

例如，这在两个处理程序中都修改了 `out`：

```rust
use tokio::sync::oneshot;

#[tokio::main]
async fn main() {
    let (tx1, rx1) = oneshot::channel();
    let (tx2, rx2) = oneshot::channel();

    let mut out = String::new();

    tokio::spawn(async move {
        // 在 `tx1` 和 `tx2` 上发送值。
# let _ = tx1.send("one");
# let _ = tx2.send("two");
    });

    tokio::select! {
        _ = rx1 => {
            out.push_str("rx1 completed");
        }
        _ = rx2 => {
            out.push_str("rx2 completed");
        }
    }

    println!("{}", out);
}
```

## 循环

`select!` 宏经常在循环中使用。本节将介绍一些例子来展示在循环中使用 `select!` 宏的常见方法。我们从在多个通道上选择开始：

```rust
use tokio::sync::mpsc;

#[tokio::main]
async fn main() {
    let (tx1, mut rx1) = mpsc::channel(128);
    let (tx2, mut rx2) = mpsc::channel(128);
    let (tx3, mut rx3) = mpsc::channel(128);
# tx1.clone().send("hello").await.unwrap();
# drop((tx1, tx2, tx3));

    loop {
        let msg = tokio::select! {
            Some(msg) = rx1.recv() => msg,
            Some(msg) = rx2.recv() => msg,
            Some(msg) = rx3.recv() => msg,
            else => { break }
        };

        println!("Got {:?}", msg);
    }

    println!("All channels have been closed.");
}
```

This example selects over the three channel receivers. When a message is
received on any channel, it is written to STDOUT. When a channel is closed,
`recv()` returns with `None`. By using pattern matching, the `select!`
macro continues waiting on the remaining channels. When all channels are
closed, the `else` branch is evaluated and the loop is terminated.

The `select!` macro randomly picks branches to check first for readiness. When
multiple channels have pending values, a random channel will be picked to
receive from. This is to handle the case where the receive loop processes
messages slower than they are pushed into the channels, meaning that the
channels start to fill up. If `select!` **did not** randomly pick a branch
to check first, on each iteration of the loop, `rx1` would be checked first. If
`rx1` always contained a new message, the remaining channels would never be
checked.

> **info**
> If when `select!` is evaluated, multiple channels have pending messages, only
> one channel has a value popped. All other channels remain untouched, and their
> messages stay in those channels until the next loop iteration. No messages are
> lost.

### Resuming an async operation

Now we will show how to run an asynchronous operation across multiple calls to
`select!`. In this example, we have an MPSC channel with item type `i32`, and an
asynchronous function. We want to run the asynchronous function until it
completes or an even integer is received on the channel.

```rust
async fn action() {
    // Some asynchronous logic
}

#[tokio::main]
async fn main() {
    let (mut tx, mut rx) = tokio::sync::mpsc::channel(128);    
#   tokio::spawn(async move {
#       let _ = tx.send(1).await;
#       let _ = tx.send(2).await;
#   });
    
    let operation = action();
    tokio::pin!(operation);
    
    loop {
        tokio::select! {
            _ = &mut operation => break,
            Some(v) = rx.recv() => {
                if v % 2 == 0 {
                    break;
                }
            }
        }
    }
}
```

Note how, instead of calling `action()` in the `select!` macro, it is called
**outside** the loop. The return of `action()` is assigned to `operation`
**without** calling `.await`. Then we call `tokio::pin!` on `operation`.

Inside the `select!` loop, instead of passing in `operation`, we pass in `&mut
operation`. The `operation` variable is tracking the in-flight asynchronous
operation. Each iteration of the loop uses the same operation instead of issuing
a new call to `action()`.

The other `select!` branch receives a message from the channel. If the message
is even, we are done looping. Otherwise, start the `select!` again.

This is the first time we use `tokio::pin!`. We aren't going to get into the
details of pinning yet. The thing to note is that, to `.await` a reference,
the value being referenced must be pinned or implement `Unpin`.

If we remove the `tokio::pin!` line and try to compile, we get the following
error:

```text
error[E0599]: no method named `poll` found for struct
     `std::pin::Pin<&mut &mut impl std::future::Future>`
     in the current scope
  --> src/main.rs:16:9
   |
16 | /         tokio::select! {
17 | |             _ = &mut operation => break,
18 | |             Some(v) = rx.recv() => {
19 | |                 if v % 2 == 0 {
...  |
22 | |             }
23 | |         }
   | |_________^ method not found in
   |             `std::pin::Pin<&mut &mut impl std::future::Future>`
   |
   = note: the method `poll` exists but the following trait bounds
            were not satisfied:
           `impl std::future::Future: std::marker::Unpin`
           which is required by
           `&mut impl std::future::Future: std::future::Future`
```

Although we covered `Future` in [the previous chapter][async], this error still isn't
very clear. If you hit such an error about `Future` not being implemented when attempting
to call `.await` on a **reference**, then the future probably needs to be pinned.

Read more about [`Pin`][pin] on the [standard library][pin].

[pin]: https://doc.rust-lang.org/std/pin/index.html

### Modifying a branch

Let's look at a slightly more complicated loop. We have:

1. A channel of `i32` values.
2. An async operation to perform on `i32` values.

The logic we want to implement is:

1. Wait for an **even** number on the channel.
2. Start the asynchronous operation using the even number as input.
3. Wait for the operation, but at the same time listen for more even numbers on
   the channel.
4. If a new even number is received before the existing operation completes,
   abort the existing operation and start it over with the new even number.

```rust
async fn action(input: Option<i32>) -> Option<String> {
    // If the input is `None`, return `None`.
    // This could also be written as `let i = input?;`
    let i = match input {
        Some(input) => input,
        None => return None,
    };
    // async logic here
#   Some(i.to_string())
}

#[tokio::main]
async fn main() {
    let (mut tx, mut rx) = tokio::sync::mpsc::channel(128);
    
    let mut done = false;
    let operation = action(None);
    tokio::pin!(operation);
    
    tokio::spawn(async move {
        let _ = tx.send(1).await;
        let _ = tx.send(3).await;
        let _ = tx.send(2).await;
    });
    
    loop {
        tokio::select! {
            res = &mut operation, if !done => {
                done = true;

                if let Some(v) = res {
                    println!("GOT = {}", v);
                    return;
                }
            }
            Some(v) = rx.recv() => {
                if v % 2 == 0 {
                    // `.set` is a method on `Pin`.
                    operation.set(action(Some(v)));
                    done = false;
                }
            }
        }
    }
}
```

We use a similar strategy as the previous example. The async fn is called
outside of the loop and assigned to `operation`. The `operation` variable is
pinned. The loop selects on both `operation` and the channel receiver.

Notice how `action` takes `Option<i32>` as an argument. Before we receive the
first even number, we need to instantiate `operation` to something. We make
`action` take `Option` and return `Option`. If `None` is passed in, `None` is
returned. The first loop iteration, `operation` completes immediately with
`None`.

This example uses some new syntax. The first branch includes `, if !done`. This
is a branch precondition. Before explaining how it works, let's look at what
happens if the precondition is omitted. Leaving out `, if !done` and running the
example results in the following output:

```text
thread 'main' panicked at '`async fn` resumed after completion', src/main.rs:1:55
note: run with `RUST_BACKTRACE=1` environment variable to display a backtrace
```

This error happens when attempting to use `operation` **after** it has already
completed. Usually, when using `.await`, the value being awaited is consumed. In
this example, we await on a reference. This means `operation` is still around
after it has completed.

To avoid this panic, we must take care to disable the first branch if
`operation` has completed. The `done` variable is used to track whether or not
`operation` completed. A `select!` branch may include a **precondition**. This
precondition is checked **before** `select!` awaits on the branch. If the
condition evaluates to `false` then the branch is disabled. The `done` variable
is initialized to `false`. When `operation` completes, `done` is set to `true`.
The next loop iteration will disable the `operation` branch. When an even
message is received from the channel, `operation` is reset and `done` is set to
`false`.

## 按任务并发

`tokio::spawn` 和 `select!` 都能够运行并发异步操作。然而，用于运行并发操作的策略不同。`tokio::spawn` 函数接受一个异步操作并生成一个新任务来运行它。任务是 Tokio 运行时调度的对象。两个不同的任务由 Tokio 独立调度。它们可能在不同的操作系统线程上同时运行。因此，生成的任务与生成的线程有相同的限制：不能借用。

`select!` 宏在**同一个任务**上并发运行所有分支。因为 `select!` 宏的所有分支都在同一个任务上执行，它们永远不会**同时**运行。`select!` 宏在单个任务上复用异步操作。