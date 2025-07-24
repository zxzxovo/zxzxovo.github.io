+++
date = '2025-07-24'
draft = false
title = 'Rust标准库的Prelude'
image = "./navigation.jpg"
description = "Rust标准库中的预导入部分有哪些内容"
categories = ["Code"]
tags = ["Rust", "Rust标准库", "Prelude", "学习"]
topped = false
+++

# Rust标准库的Prelude

## Intro

Rust 的标准库提供了很多基础组件和工具。如果在使用任何标准库的组件时都要写一遍导入，就会让代码冗余，显得"唠叨"。如果默认导入标准库中的很多组件，而其中含有你尚未使用到的组件，这同样不好。因此 Rust 的标准库提供了 `prelude` 来默认导入几乎在所有 Rust 程序中都会用到的一小部分内容。

Rust 的 `prelude` 主要有两个部分：
- `std::prelude` ：最常见的预导入模块，包含了标准库中最常用的类型和 trait。编写普通的 Rust 程序时，这些内容默认都是可用的。
- `core::prelude` ：是 `std` prelude 的基础。在 `no_std` 环境下，只有 core 的 prelude 可用，它包含了最基础的语言特性。

`prelude` 方式也被很多 crate 采用，可以在许多第三方库中发现它们也提供了 `prelude` 模块用于预导入一部分内容。第三方库与标准库的 `prelude` 是不同的，当你开始编写Rust程序时，标准库 `prelude` 的内容就已经是可用的了，但在你使用第三方库时，还是需要手动导入它(比如 `use some_crate::prelude::*;` )，尽管如此，它还是能起到在库的 API 较为复杂时，帮助用户快速上手等作用。

## Version

不同的 Rust 版本中，标准库 `prelude` 包含的内容可能不同。`prelude` 的第一个版本是 `v1`，在 *Rust 2015* 和 *Rust 2018* 中直接使用了该版本，没有任何更改。*Rust 2021* 和 *Rust 2024* 新增了一些内容。

## Content

这里按照版本和模块简要介绍 Rust 的 `prelude` 内容。

官方文档内容可以直接查看： [Rust Doc](https://doc.rust-lang.org/std/prelude/index.html)

### V1

> *v1* 版本文档: [Module V1](https://doc.rust-lang.org/std/prelude/v1/index.html)
> *Rust 2015*, *Rust 2018* 版本的 `prelude` 与 *v1* 相同。

#### std::prelude::v1 

**Marker Traits (标记 Traits):**
- `std::marker::Copy` - 复制语义，表示类型可以通过简单的位复制来复制
- `std::marker::Send` - 线程安全传输，表示类型可以安全地在线程间传输所有权
- `std::marker::Sized` - 编译时已知大小，表示类型在编译时有确定的大小
- `std::marker::Sync` - 线程安全共享，表示类型可以安全地在线程间共享引用
- `std::marker::Unpin` - 可安全移动，表示类型可以安全地从内存中移动

**Operations Traits (操作类 Traits):**
- `std::ops::Drop` - 析构 trait，定义值离开作用域时的清理行为
- `std::ops::Fn` - 不可变闭包 trait
- `std::ops::FnMut` - 可变闭包 trait  
- `std::ops::FnOnce` - 一次性闭包 trait

**Memory Management (内存管理相关):**
- `std::boxed::Box` - 堆分配的智能指针，用于在堆上分配单个值
- `std::borrow::ToOwned` - 由借用数据创建具有所有权的数据的 trait

**Collections (集合类型):**
- `std::vec::Vec` - 动态数组
- `std::string::String` - 拥有所有权的可变 UTF-8 字符串

**Error Handling (错误处理):**
- `std::option::Option` 及 `Some` 和 `None` 
- `std::result::Result` 及 `Ok` 和 `Err` 

**Comparison Traits (类型比较 Traits):**
- `std::cmp::PartialEq` - 部分等价关系，支持 `==` 和 `!=` 操作符
- `std::cmp::PartialOrd` - 部分排序关系，支持 `<`, `<=`, `>`, `>=` 操作符
- `std::cmp::Eq` - 完全等价关系，表示自反的等价关系
- `std::cmp::Ord` - 完全排序关系，表示全序关系

**Cloning and Default (克隆和默认值):**
- `std::clone::Clone` - 克隆 trait，定义 `clone()` 方法用于显式复制
- `std::default::Default` - 默认值 trait，定义类型的默认值

**Debug and Display (调试和显示):**
- `std::fmt::Debug` - 调试格式化 trait，用于 `{:?}` 格式化
- `std::hash::Hash` - 哈希 trait，用于计算类型的哈希值

**Conversion Traits (转换 Traits):**
- `std::convert::AsRef` - 引用转换，将一个类型的引用转换为另一个类型的引用
- `std::convert::AsMut` - 可变引用转换
- `std::convert::Into` - 消耗所有权的转换，将一个类型转换为另一个类型
- `std::convert::From` - 类型转换，从一个类型创建另一个类型

**Iterator Traits (迭代器 Traits):**
- `std::iter::Iterator` - 迭代器 trait，定义迭代行为
- `std::iter::Extend` - 扩展 trait，允许用迭代器扩展集合
- `std::iter::IntoIterator` - 转换为迭代器的 trait
- `std::iter::DoubleEndedIterator` - 双端迭代器，可以从两端迭代
- `std::iter::ExactSizeIterator` - 精确大小迭代器，可以准确报告剩余元素数量

**String Conversion:**
- `std::string::ToString` - 转换为字符串的 trait

**Macros (宏):**
从 `std::macros` 重新导出的各种宏，包括但不限于：
- `println!` - 打印到标准输出并换行
- `print!` - 打印到标准输出
- `format!` - 格式化字符串
- `vec!` - 创建 Vec 的便捷宏
- `panic!` - 程序终止
- `assert!`, `assert_eq!`, `assert_ne!` - 断言宏
- `debug_assert!`, `debug_assert_eq!`, `debug_assert_ne!` - 调试断言宏

#### core::prelude::v1

`core::prelude::v1` 重新导出 `core::prelude::rust_2015`，包含以下内容：

**Marker Traits:**
- `core::marker::{Copy, Send, Sized, Sync, Unpin}`

**Operations:**
- `core::ops::{Drop, Fn, FnMut, FnOnce}`

**Memory:**
- `core::mem::drop` - drop 一个值，通过调用该类型实现 Drop trait 的方法

**Comparison:**
- `core::cmp::{PartialEq, PartialOrd, Eq, Ord}`

**Cloning and Default:**
- `core::clone::Clone`
- `core::default::Default`

**Conversion:**
- `core::convert::{AsRef, AsMut, Into, From}`

**Iterator:**
- `core::iter::{Iterator, Extend, IntoIterator, DoubleEndedIterator, ExactSizeIterator}`

**Option and Result:**
- `core::option::Option::{self, Some, None}`
- `core::result::Result::{self, Ok, Err}`

**Macros:**
核心宏，包括 `panic!`, `assert!` 系列等。

### Rust 2021

> *Rust 2021 prelude* 文档: [Module rust_2021](https://doc.rust-lang.org/std/prelude/rust_2021/index.html)

该版本重新导出 `super::v1::*` (即 v1 的所有内容) 和 `core::prelude::rust_2021::*`，新增内容：

**新增的转换 Traits:**
- `core::convert::TryInto` - 可能失败的消费所有权的转换
- `core::convert::TryFrom` - 可能失败的类型转换  
- `core::iter::FromIterator` - 从迭代器构建集合的 trait

### Rust 2024

> *Rust 2024 prelude* 文档: [Module rust_2024](https://doc.rust-lang.org/std/prelude/rust_2024/index.html)

该版本重新导出 `super::rust_2021::*` (即 Rust 2021 的所有内容) 和 `core::prelude::rust_2024::*`，新增内容：

**异步编程支持:**
- `core::future::Future` - 异步 trait, 表示一个异步计算过程
- `core::future::IntoFuture` - 可转换为 Future 的 trait，类似于 IntoIterator
