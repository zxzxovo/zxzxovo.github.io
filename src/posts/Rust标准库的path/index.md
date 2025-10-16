+++
date = '2025-08-07'
title = 'Rust标准库中的path'
image = "./navigation.jpg"
description = "关于Rust标准库中路径处理的跨平台抽象模块 path 以及它的一些细节"
categories = ["Code"]
tags = ["Rust", "Rust标准库", "path", "学习", "路径", "跨平台", "字符串"]
topped = false
+++

## Intro

本文介绍 Rust 的 `std::path` 模块。该模块只包含一个文件 `path.rs` ，在编写本文时，它共有 _3729_ 行。

> `std::path` 模块的在线文档：[std::path - Rust]

`path` 模块提供了用于处理**文件路径**的**跨平台**的抽象，当我们正确使用该模块内的操作时，就无需为不同操作系统上的路径操作做额外的适配了。

## Basic

本模块提供了两个路径的**核心类型**： `PathBuf` 和 `Path` ，它们相当于文件路径的 `String` 和 `str` 版本。那么可以联想到， `PathBuf` 是拥有所有权的路径， `Path` 是一个不可变的路径切片，在使用它时常会通过 `&Path` 的方式，类似于 `&str` 。

- `Path` 主要用于**解析**路径，当获得一个 `Path` 后就可以调用它提供的各种方法来解析路径的含义。比如可以通过 `extension()` 方法来解析文件的扩展名。
- `PathBuf` 主要用于**修改或构建**路径。类似于可以调用 `String` 的各种方法来修改或者添加字符串，可以使用各种方法来构建路径。

在实现上， `PathBuf` 和 `Path` 分别是 `OsString` 和 `OsStr` 的轻量级封装。这两种你可能没见过的字符串类型位于 `std::ffi` 模块中，是用于表示**操作系统字符串**的类型，它们是平台相关的。因为 path 是跨平台的文件操作，路径是用字符串表示的，而不同平台上的字符串表示略有差异，因此使用了这两种字符串类型，用于安全地和操作系统的文件系统API进行交互。

> 在类 Unix 系统中，字符串通常是8位的字节序列（如 `Vec<u8>` ），多数时候被解析为 UTF-8 。在 Windows 下，字符串通常是16位值组成的序列（虽然存储时也是按照8位的字节序列存储），在有效情况下被解析为 UTF-16 。而 Rust 的字符串类型 `String` 和 `str` 则一直是有效的 UTF-8 。
> 为了保证内存安全和正确的字符串处理，Rust 不允许直接将**任意字节序列**解释为 _UTF-8_ 编码的 `String` 或 `&str`。如果操作系统传入的字符串包含无效的 UTF-8 序列，直接转换会导致运行时错误或数据丢失。而 `OsString` 和 `OsStr` 是平台相关的，它们提供了一个安全的中间层，能可靠地 **存储和传递操作系统字符串** ，而不强制进行 UTF-8 编码。
> 在这里我们只需要知道，它们是用于在不同平台上**安全**地处理字符编码的。

除非特别说明，本模块内那些不会访问文件系统的路径方法（即只在内存中对路径字符串进行操作），如 `Path::starts_with` 和 `Path::ends_with` 等，在任何时候都是 **大小写敏感** 的。唯一**例外**的是 **Windows驱动器盘符** ，比如 `D:` 和 `d:` 被认为是相同的。

## Usage

在本模块的用法方面，我们主要介绍开发中最常用到的 `Path` 和 `PathBuf` 。要查看更多组件的用法，参加下一节或在线文档。这里仅对其公共 API 做简要介绍。

> 在线文档 [std::path - Rust]

### Path

`Path` 是 _unsized_ 类型，必须通过引用或智能指针来使用，如 `&Path`, `Box<Path>` 。它具有将路径解析成 Component （该模块下的一个枚举，用于描述路径的各个组成部分），提取文件名，扩展名等信息，判断路径的性质，进行文件系统交互等多种功能。
简而言之， `Path` 的作用在于 _检查、查询路径，与文件系统交互_ 。

> `Path` 的在线文档：[path::Path]

首先是 `Path` 的 `impl` 块中的方法。

1. **构造，转换**
   - `pub fn new<S: AsRef<OsStr> + ?Sized>(s: &S) -> &Path`
     构建 `Path` 的主要方式，将 `&str` 零开销转换为 `&Path` 。
   - `pub fn to_str(&self) -> Option<&str>`
     将 `&Parh` 转换为 `&str` 切片，由于其内部封装的字符串可能包含非 UTF-8 编码的数据，转换可能失败，因此会返回一个 Option 。
   - `pub fn to_path_buf(&self) -> PathBuf`
     将 `&Path` 转换为带有所有权的 `PathBuf` 。
   - `pub fn to_string_lossy(&self) -> Cow<'_, str>`
     将 `Path` 转换为一个 `Cow` 封装的字符串（位于 `std::borrow` ）。若路径中包含无效的 UTF-8 字符，会使用 U+FFFD （ Unicode的替换字符 “�” ） 将其替换，所以转换后总是能得到一个有效的 `str` 。
   - `pub fn as_mut_os_str(&mut self) -> &mut OsStr`
     返回内部 `OsStr` 的可变引用，还有个返回不可变引用的方法(去掉签名中的 mut )。
2. **路径组件操作**
   - `pub fn parent(&self) -> Option<&Path>`
     返回路径的父目录，如果路径没有父目录（例如根目录或空字符串），则返回 `None` 。
   - `pub fn ancestors(&self) -> Ancestors<'_>`
     返回的类型是一个迭代器，它依次产生路径本身及其每个父目录，直到到达根目录。如路径 `/a/b/c.txt` 将依次产生 `/a/b/c.txt` ， `/a/b` ， `/a` ， `/` 。
   - `pub fn file_name(&self) -> Option<&OsStr>`
     返回路径的最后一个组件，通常是文件名或目录名。
   - `pub fn file_stem(&self) -> Option<&OsStr>`
     提取文件名的“主干”（stem），即没有扩展名的文件名，如 `runMe.exe` 会产生 `runMe` ，如果是文件夹则返回 `None` 。若文件名部分没有 `.` 则返回整个文件名，以 `.` 开头亦是。
   - `pub fn extension(&self) -> Option<&OsStr>`
     提取文件的扩展名，即最后一个 `.` 之后的部分。如 `runMe.exe` 会产生 `exe` ，如果是文件夹则返回 `None` 。如果没有 `.` 或文件名以 `.` 开头也返回 `None` 。
   - `pub fn file_prefix(&self) -> Option<&OsStr>`
     unstable API，提取文件名的前缀，即第一个 `.` 之前的部分。
3. **路径属性获取**
   - `pub fn is_absolute(&self) -> bool`
     判断路径是否是绝对路径。
   - `pub fn is_relative(&self) -> bool`
     判断路径是否是相对路径。
   - `pub fn has_root(&self) -> bool`
     判断路径是否包含根目录，在类 unix 系统下即判断路径是否以 `/` 开头。
4. **路径比较和拼接**
   - `pub fn strip_prefix<P>(&self, base: P) -> Result<&Path, StripPrefixError>`
     移除路径的前缀。
   - `pub fn starts_with<P: AsRef<Path>>(&self, base: P) -> bool`
     检查路径是否以 `base` 为前缀。
   - `pub fn ends_with<P: AsRef<Path>>(&self, child: P) -> bool`
     检查路径是否以 `child` 为后缀。
   - `pub fn join<P: AsRef<Path>>(&self, path: P) -> PathBuf`
     将另一个路径 `path` 拼接在 `self` 后面。
   - `pub fn with_file_name<S: AsRef<OsStr>>(&self, file_name: S) -> PathBuf`
     返回一个带有新文件名的 `PathBuf`。
   - `pub fn with_extension<S: AsRef<OsStr>>(&self, extension: S) -> PathBuf`
     返回一个带有新扩展名的 `PathBuf`。
   - `pub fn with_added_extension<S: AsRef<OsStr>>(&self, extension: S) -> PathBuf`
     unstable API, 在现有扩展名后追加一个新的扩展名。
5. **文件系统交互**
   - `pub fn metadata(&self) -> Result<Metadata>` , `pub fn symlink_metadata(&self) -> Result<Metadata>`
     查询文件系统的元数据，前者会跟随链接（顺着符号链接查询指向的文件实体），后者不会跟随符号链接查询，只返回符号链接本身的元数据。
   - `pub fn canonicalize(&self) -> Result<PathBuf>`
     返回路径的**规范化绝对形式**，会解析然后规范化所有 `.`、`..` 和符号链接。
   - `pub fn read_link(&self) -> Result<PathBuf>`
     读取符号链接指向的目标路径。
   - `pub fn read_dir(&self) -> Result<ReadDir>`
     返回类型是一个迭代器，用于遍历目录中的所有条目。
   - `pub fn exists(&self) -> bool`
     检查路径指向的实体是否存在，此方法有 TOCTOU 风险（在此之后若要进行其他操作，由于不是原子操作，则其状态可能改变导致出错，比如其他进程在检查后删除或添加了该文件）。
   - `pub fn try_exists(&self) -> Result<bool>`
     与 `exists` 类似，但能更精确地处理错误。
   - `pub fn is_file(&self) -> bool` , `is_dir` , `is_symlink`
     判断路径是否代表一个常规文件，目录或一个符号链接，不会跟随链接（不会顺着符号链接检查其指向的类型）。
6. 迭代器
   - `components()`
     提供遍历**路径组件**的迭代器。它会对路径进行一些规范化操作，如忽略重复的分隔符（`//`）、移除 `.` 等。其返回值是 `Component` ，在该模块下的另一个用于表示路径组件的结构体。
   - `iter()`
     提供遍历**路径组件**的迭代器，但返回的是 `&OsStr` 切片。
7. **其他方法**
   - `pub fn display(&self) -> Display<'_>`
     返回一个实现了 `Display` trait 的对象，用于安全地显示路径，可能会进行有损转换。
   - `pub fn into_path_buf(self: Box<Path>) -> PathBuf`
     将 `Box<Path>` 转换为 `PathBuf`，这是一个零拷贝的转换。

除此之外， `Path` 中还有很多 trait 实现。

1. 借用和转换
   `ToOwned` Trait 允许你将一个借用类型克隆成一个拥有所有权的类型，你可以使用 `.to_owned()` 或 `.to_path_buf()` 将 `&Path` 转换为 `PathBuf`。
   `AsRef<T>` Trait 允许 `Path` 与其他类型的互相转换（其定义于 `std::convert` 中）。这是 Rust 中 **非常常见的设计模式** ，用于创建灵活的函数签名，可以接受多种类型的参数。
   `From<&Path>` 可以使 `Path` 被转换为 `Box<Path>`, `Arc<Path>`, `Rc<Path>` 等智能指针。
2. 比较和排序
   `PartialEq` 和 `Eq` 使得 `Path` 可以使用 `==` 和 `!=` 进行相等性比较。
   `PartialOrd` 和 `Ord` 使得 `Path` 可以被排序，例如在 `BTreeMap` 中作为键。
   **`Hash`** 允许 `Path` 作为 `HashMap` 或 `HashSet` 的键。
   比较和排序是**按字节进行**的，与平台实现无关。
3. 格式化输出和迭代
   `Debug` trait 允许你使用 `{:?}` 格式化 `Path`。它会显示底层数据结构，能正确处理非 UTF-8 的字符数据。
   没有实现 `Display` trait，但可以调用其 `.display()` 方法，通过进行有损转换（可能）来获得一个可以安全打印非 UTF-8 字符的实现了 `Display` Trait 的结构体。
   `Path` 可以被认为是路径组件（参见该模块下的 `Component` 结构体）的集合，因此它实现了 `IntoIterator` ，我们可以通过 `for` 循环遍历它的所有组件。

### PathBuf

`PathBuf` 是拥有所有权的可变的路径表示，类似于 `String` 。它提供了 `push` 等方法用于修改路径。此外，它还实现了 `Deref<Target = Path>` ，因此你可以在 `PathBuf` 实例上调用所有 `Path` 的方法。
简而言之， `PathBuf` 的作用在于 _构建、修改路径，持有路径所有权_ 。

> `Path` 的在线文档：[path::PathBuf]

首先是 `Path` 的 `impl` 块中的方法。

1. **构造，转换**
   - `pub fn new() -> PathBuf`
     创建一个空的 **`PathBuf`** 。
   - `pub fn with_capacity(capacity: usize) -> usize`
     以事先确定的容量构建 `PathBuf` ，类似于 `Vec` 的 `with_capacity` 。
   - `pub fn into_os_string(self) -> OsString`
     消耗 **`PathBuf`** 的所有权，将其转换为 **`OsString`**，这是一个零开销的操作。
   - `pub fn into_boxed_path(self) -> Box<Path>`
     消耗 **`PathBuf`** 的所有权，将其转换为 **`Box<Path>`**，同样是零开销的操作。
   - `pub fn as_mut_os_string(&mut self) -> &mut OsString`
     返回内部 `OsString` 的可变引用。
   - `pub fn as_path(&self) -> &Path`
     返回 `Path` 切片。
   - `pub fn leak<'a>(self) -> &'a mut Path`
     Unstable API ，消耗 `PathBuf` 的所有权并将其泄露，返回对内容的可变引用，使其可以具有 `'static` 生命周期。它不会重新分配或缩小 `PathBuf`，因此如果调用此方法时包含未使用的容量，它们并不会在返回的切片索引范围内。想要丢弃多余的容量时建议使用 `into_boxed_path` 搭配 `Box::leak` 。
2. 容量管理
   - `pub fn capacity(&self) -> usize`
     返回 **`PathBuf`** 内部数据的存储容量，类似于 `Vec` 的 `capacity` ，不过这里是以字节为单位。
   - `pub fn clear(&mut self)`
     清空 **`PathBuf`** 的内容。
   - `pub fn reserve(&mut self, additional: usize)`
     在当前构建的 `PathBuf` 的基础上，确保其还能再容纳 `additional` 参数指定的数据（字节数）。
   - `pub fn try_reserve(&mut self, additional: usize) -> Result<(), TryReserveError>`
     与 `reserve` 类似，但它在内存分配失败时返回一个 `Result` 类型。
   - `pub fn reserve_exact(&mut self, additional: usize)`
     与 `reserve` 类似，但这个方法会让 `PathBuf` 的容量确切等于自身与 `additional` 的字节数的和。还有一个 `try_reserve_exact` 方法，不过返回的是 `Result` 。
   - `pub fn shrink_to_fit(&mut self)`
     减少 **`PathBuf`** 的 `capacity` ，使其刚好可以容纳当前构建的路径。
   - `pub fn shrink_to(&mut self, min_capacity: usize)`
     减少 **`PathBuf`** 的 `capacity` ，使其不低于给定的值。
3. **路径修改**
   - `pub fn push<P: AsRef<Path>>(&mut self, path: P)`
     将一个路径组件附加到 **`PathBuf`** 的末尾。需要注意如果 `path` 是绝对路径，它会**替换**掉 **`PathBuf`** 的内容。
   - `pub fn pop(&mut self) -> bool`
     移除 **`PathBuf`** 的最后一个路径组件。如果成功移除则返回 `true`，否则返回 `false` 。常用于将路径转换为上级目录的操作。
   - `pub fn set_extension<S: AsRef<OsStr>>(&mut self, extension: S)`
     替换或添加路径的扩展名。若当前没有扩展名则添加，若有则替换。
   - `pub fn set_file_name<S: AsRef<OsStr>>(&mut self, file_name: S)`
     替换或添加路径的最后一个组件（文件名），其所说的 `file_name` 与 `Path` 种的 `file_name` 方法所指相同。当 `file_name` 不存在时添加，若存在，则相当于先 `pop` 后 `push` 的操作。
   - `pub fn add_extension<S: AsRef<OsStr>>(&mut self, extension: S)`
     Unstable API ，在现有扩展名后追加一个新的扩展名。

以下是 `PathBuf` 中的部分 trait 实现。

1. 借用和转换
   `PathBuf` 实现了 `Clone` ， `ToOwned` 等多种 Trait 。
   它还实现了 `Deref<Target = Path>` ， `DerefMut<Target = Path>` ， `Borrow<Path>`， `BorrowMut<Path>` ， `AsRef<Path>` ， `AsMut<Path>` 等多种 Trait 来支持与 `Path` 交互。
   此外它还实现了 `From<S>` ，允许从 `&str`, `String`, `OsString`, `Path`, `&Path` 等类型转换为 `PathBuf` 。
2. 比较和排序
   与 `Path` 类似，同样实现了 `PartialEq`, `Eq`, `PartialOrd`, `Ord`, `Hash` 等 Trait 。
3. 格式化输出和迭代
   实现了 `Debug` 和 `Display` 。注意 `Path` 本身并未实现 `Display` ，它使用 `display` 方法返回一个实现了 `Display` 的辅助类型。而 `PathBuf` 自身实现了 `Display` 。

## More

在前一节我们对 `Path` 和 `PathBuf` 的介绍中，出现了一些其他的数据类型，在这里做一些简要介绍。

### Component 枚举

`Component` 枚举表示文件路径中的的一个独立的已解析的段。它是 `Components` 迭代器每次迭代的值的类型。
其简化后的定义如下：

```rust
#[derive(Copy, Clone, PartialEq, Eq, PartialOrd, Ord, Hash, Debug)]
pub enum Component<'a> {
    Prefix(PrefixComponent<'a>),
    RootDir,
    CurDir,
    ParentDir,
    Normal(&'a OsStr),
}
```

`Component` 枚举包含以下变体，每个变体代表路径中的一种特定元素：

- `Prefix(PrefixComponent<'a>)`
  表示 Windows 系统特有的路径前缀，例如 `C:`、`\\server\share` 或 `\\?\`。此变体仅会在 Windows 系统上出现。
- `RootDir`
  表示根目录组件，例如 Unix 上的 `/` 或 Windows 上的 `C:\`。它出现在任何前缀之后，其他组件之前，表示路径从根目录开始。
- `CurDir`
  表示当前目录，用 `.` 表示。
- `ParentDir`
  表示父目录，用 `..` 表示。
- `Normal(&'a OsStr)`
  最常见的变体，表示普通的文件或目录名称，例如 `a/b` 中的 `a` 和 `b` 。

`Component` 有一个核心方法：

```rust
    pub fn as_os_str(self) -> &'a OsStr {
        match self {
            Component::Prefix(p) => p.as_os_str(),
            Component::RootDir => OsStr::new(MAIN_SEP_STR),
            Component::CurDir => OsStr::new("."),
            Component::ParentDir => OsStr::new(".."),
            Component::Normal(path) => path,
        }
    }
```

此方法从 `Component` 中提取底层的 `OsStr` 切片，从而可以访问组件的原始字符串数据。
在使用时，如 `Path::new("/tmp/foo/bar.txt").components()` 产生的 `Components` 迭代器会依次产生：

- `Component::RootDir`
- `Component::Normal("tmp")`
- `Component::Normal("foo")`
- `Component::Normal("bar.txt")`

通过 `as_os_str()` 方法，可以获取这些组件的字符串表示：

```rust
    let strs: Vec<&str> = Path::new("./tmp/foo/bar.txt")
        .components()
        .map(|comp| comp.as_os_str().to_str().unwrap())
        .collect();
    assert_eq!(vec![".", "tmp", "foo", "bar.txt"], strs);
```

### Components 迭代器

`Components` 迭代器没有提供构造函数，且其字段不是 `pub` 的，所以我们不能自己构建它。它只能是由 `Path::components()` 方法构建并返回的。该迭代器执行一组特定的操作以简化路径的解释，而无需解析文件系统。
生成该迭代器的函数的定义如下：

```rust
    pub fn components(&self) -> Components<'_> {
        let prefix = parse_prefix(self.as_os_str());
        Components {
            path: self.as_u8_slice(),
            prefix,
            has_physical_root: has_physical_root(self.as_u8_slice(), prefix),
            front: State::Prefix,
            back: State::Body,
        }
    }
```

我们可以看到，其 `front` 和 `back` 字段是一个 `State` 枚举的变体。找到它的定义，其简化后的源码如下：

```rust
enum State {
    Prefix = 0,   // 前缀部分
    StartDir = 1, // 起始目录
    Body = 2,     // 主体路径
    Done = 3,     // 解析完成
}
```

再来看看 `Components` 自己的代码：

```rust
#[derive(Clone)]
pub struct Components<'a> {
    // 路径的原始字节切片，用于后续解析
    path: &'a [u8],

    // Windows 路径前缀
    prefix: Option<Prefix<'a>>,

    // 标识路径是否从文件系统根开始
    has_physical_root: bool,

    // 双向迭代器的状态机记录
    front: State,
    back: State,
}
```

该迭代器是完成路径解析的主要部分，它进行了许多规范化，在使用上， `Path::new("/tmp/foo.txt").components()` 将依次产生 `RootDir`、`Normal("tmp")` 和 `Normal("foo.txt")` 。
关于路径解析的细节，请查看源码中 `Components` 的迭代器实现方法。

### Iter 迭代器

与 `components()` 迭代器不同，`Iter` 由 `Path::iter()` 方法返回，它直接产生 `OsStr` 切片，包括分隔符。
其简化后的定义如下：

```rust
#[derive(Clone)]
pub struct Iter<'a> {
    inner: Components<'a>,
}
```

`Iter` 迭代器产生表示路径组件的 `OsStr` 切片 。它不执行与 `components()` 相同的规范化级别。比如它可能会将根分隔符作为独立的 `OsStr` 组件产生 ：
如 `Path::new("/tmp/foo.txt").iter()` 将依次产生 `OsStr::new("/")`、`OsStr::new("tmp")` 和 `OsStr::new("foo.txt")` 。
`&Path` 实现了 `IntoIterator` Trait 。`Item` 类型是 `&'a OsStr`，`IntoIter` 类型是 `Iter<'a>` ，这允许直接通过 `for` 循环遍历 `&Path` 以获取其组件作为 `OsStr` 切片 。

使用 Gemini 生成了 `components()` 和 `iter()` 两种方法的对比表格，方便阅读：

| 特性                      | `components()` 行为                | `iter()` 行为                  | 含义                                                                                       |
| ------------------------- | ---------------------------------- | ------------------------------ | ------------------------------------------------------------------------------------------ |
| **返回类型**              | `Component` 枚举变体               | `&OsStr` 切片                  | `components()` 提供结构化、语义化的路径部分，而 `iter()` 提供原始字符串段。                |
| **重复分隔符规范化**      | 是（忽略）                         | 否（通常包含）                 | `components()` 简化路径结构，`iter()` 保留原始表示。                                       |
| **`.` (当前目录) 规范化** | 是（移除，除非在开头）             | 否（通常包含）                 | `components()` 移除冗余的 `.`，`iter()` 保持字面量。                                       |
| **尾随斜杠规范化**        | 是（移除）                         | 否（通常包含）                 | `components()` 统一路径末尾表示，`iter()` 保持字面量。                                     |
| **`..` (父目录) 解析**    | 否（不解析）                       | 否（不解析）                   | 两者都不解析 `..`，避免对文件系统结构做出假设。                                            |
| **主要用例**              | 语义化路径解析、构建或检查路径结构 | 原始字符串访问、字面量路径表示 | `components()` 适用于理解路径的逻辑结构，`iter()` 适用于需要精确控制原始路径字符串的场景。 |

### Prefix 枚举

`Prefix` 枚举用于表示 Windows 操作系统中存在的各种路径前缀，如驱动器卷符(`C:`)、网络共享 (`\\server\share`) 和 verbatim 路径 (`\\?\`) 。此枚举在类 Unix 系统上不会出现 。

> Windows 的路径语义与 Unix 相比更为复杂，从它具有多种前缀以及 Rust 标准库中要专门为其增添几个类型就能看到。其复杂性可能源于历史包袱，如 Windows 的路径长度限制、特定的字符处理以及系统对 `.` 和 `..` 的规范化行为。`\\?\` 前缀的 Verbatim 路径（部分中文文档直接译作“逐字”，这里保留）是一种绕过传统行为的机制，Windows 在解析到该类路径时会按字面意思解析。它可以起到 能使用更长的路径、禁用路径规范化、支持特殊字符（如将 `/` 字符视为字面量而不是分隔符）等作用。

`Prefix` 简化后的定义如下：

```rust
#[derive(Copy, Clone, Debug, Hash, PartialOrd, Ord, PartialEq, Eq)]
pub enum Prefix<'a> {
    Verbatim(&'a OsStr),
    VerbatimUNC(
        &'a OsStr,
        &'a OsStr,
    ),
    VerbatimDisk(u8),
    DeviceNS(&'a OsStr),
    UNC(
        &'a OsStr,
        &'a OsStr,
    ),
    Disk(u8),
}
```

`Prefix` 枚举包含以下变体：

- `Verbatim(&'a OsStr)`
  一个 verbatim 前缀，例如 `\\?\cat_pics`。它由 `\\?\` 紧跟给定组件构成 。
- `VerbatimUNC(&'a OsStr, &'a OsStr)`
  一个使用 UNC(Windows 统一命名约定) 的 verbatim 前缀，例如 `\\?\UNC\server\share`。它由 `\\?\UNC\` 紧跟服务器主机名和共享名构成 。
- `VerbatimDisk(u8)`
  一个 verbatim 磁盘前缀，例如 `\\?\C:`。它由 `\\?\` 紧跟驱动器字母和 `:` 构成 。
- `DeviceNS(&'a OsStr)`
  一个设备命名空间前缀，例如 `\\.\COM42`。它由 `\\.\`（也可以使用 `/` 而不是 `\`）紧跟设备名称构成 。
- `UNC(&'a OsStr, &'a OsStr)`
  一个使用 UNC 的标准前缀，例如 `\\server\share`。它由服务器主机名和共享名构成 。
- `Disk(u8)`
  一个给定磁盘驱动器的标准前缀，例如 `C:` 。

使用 Gemini 制作了下表，它详细列出了 `Prefix` 枚举的各个变体：

| 变体名称       | 描述/结构                                          | 示例路径               |
| -------------- | -------------------------------------------------- | ---------------------- |
| `Verbatim`     | verbatim 前缀，`\\?\` 后跟组件，禁用规范化。       | `\\?\cat_pics`         |
| `VerbatimUNC`  | verbatim UNC 路径，`\\?\UNC\` 后跟服务器和共享名。 | `\\?\UNC\server\share` |
| `VerbatimDisk` | verbatim 磁盘前缀，`\\?\` 后跟驱动器字母和冒号。   | `\\?\C:`               |
| `DeviceNS`     | 设备命名空间前缀，`\\.\` 后跟设备名。              | `\\.\COM42`            |
| `UNC`          | 标准 UNC 路径，`\\server\share`。                  | `\\server\share`       |
| `Disk`         | 标准磁盘驱动器前缀，如 `C:`。                      | `C:`                   |

该枚举的核心方法是 `is_verbatim(&self) -> bool` ，通过检查当前变体是否匹配定义中的Verbatim 来判断路径是否以 `\\?\` 开头。该枚举的解析构建过程是在 `Components` 部分进行的。
在实现跨平台抽象时，平台特定的复杂性是无法简单隐藏的。`std::path` 模块通过 `Prefix` 和 `Component::Prefix` 等工具，以 Rust 惯用的设计模式进行处理，而没有完全试图掩盖平台差异性。

### PrefixComponent 结构体

`Prefix` 枚举定义了 Windows 的多种前缀，还有一个 `PrefixComponent` 结构体包装了它，该结构体提供对 `Prefix` 的访问，以及提取原始 `OsStr` 的方法。 `Component` 的变体 `Component::Prefix` 中直接包含的就是 `PrefixComponent` 。
其简化后的定义如下：

```rust
#[derive(Copy, Clone, Eq, Debug)]
pub struct PrefixComponent<'a> {
    /// 保存前缀的原始、未解析字符串形式
    raw: &'a OsStr,
    /// 保存前缀的解析后结构化数据
    parsed: Prefix<'a>,
}
```

可以通过 `kind()` 和 `as_os_str()` 获取到其字段值。

### Display 结构体

`Display` 是 `Path::display()` 方法返回的辅助类型。它使用户可以安全地打印出可能含非 UTF-8 数据 `Path` 。
其定义很简单，在内部再次封装了 `os_str` 下的 Display 实现：

```rust
pub struct Display<'a> {
    inner: os_str::Display<'a>,
}
```

转换为可显示字符串的过程在某些平台上可能是不完全的。比如无效字符通常会被 U+FFFD 替换。如果需要“转义”表示（例如，为了调试或序列化），则应使用 `Debug` 的方式 `{:?}` 。

### StripPrefixError 结构体

`StripPrefixError` 是一个错误类型，当 `Path::strip_prefix()` 方法中指定的 `base` 路径不是目标路径的前缀时返回。
它定义为：`pub struct StripPrefixError(());` 。
其存在是为了增加返回的错误的语义性。

### Ancestors 迭代器

`Ancestors` 迭代器由 `Path::ancestors()` 方法返回，它提供了一种便捷的方式来向上遍历路径，依次产生路径本身及其每个父目录，直到到达根目录。
其简化后的定义如下：

```rust
#[derive(Copy, Clone, Debug)]
pub struct Ancestors<'a> {
    next: Option<&'a Path>,
}
```

其迭代器的 `next` 方法的实现是：

```rust
    fn next(&mut self) -> Option<Self::Item> {
        let next = self.next;
        self.next = next.and_then(Path::parent);
        next
    }
```

它产生的第一个项是 `self`（原始路径）。后续项是前一个路径调用 `parent()` 的结果。此过程持续进行，直到 `parent()` 返回 `None`（在根目录或空路径时）。

- `Path::new("/a/b/c").ancestors()` 将依次产生：`/a/b/c`、`/a/b`、`/a`、`/` 。
- `Path::new("foo/bar").ancestors()` 将依次产生：`foo/bar`、`foo`、` `（空路径） 。

## Summary

`std::path` 是 Rust 标准库中对文件路径进行处理的核心模块，它主要通过 **`Path`** 和 **`PathBuf`** 为开发者提供了跨平台的路径操作抽象。

- **`Path`** 是一个不可变的、借用的路径切片，类似于 `&str`。它的主要作用是**查询、解析和分析**路径信息，以及进行文件系统交互。它提供了一系列方法来获取路径的组件（如文件名、扩展名），并检查路径的性质（如是否为绝对路径）。
- **`PathBuf`** 是一个拥有所有权的、可变的路径表示，类似于 `String`。它的主要作用是**构建、修改和持有**路径的所有权。`PathBuf` 实现了 `Deref<Target = Path>`，这意味着你可以直接在 `PathBuf` 实例上调用所有 `Path` 的方法。

这两个类型通过 `OsString` 和 `OsStr` 实现，这些是平台相关的字符串类型，确保了在不同操作系统上处理非 UTF-8 字符时的**安全性**和**正确性**。此外，`path` 模块还提供了 `Component`、`Components` 等辅助类型和迭代器，用于更精细地解析路径结构，使路径操作更加灵活和强大。

理解 `Path` 和 `PathBuf` 的核心区别后，我们可以在实际开发中遵循一些最佳实践来有效地使用它们。

### 优先使用 `&Path` 作为函数参数

当你编写一个需要文件路径作为参数的函数时，如果该函数只需要**读取**或**查询**路径信息，应使用 `&Path` 作为参数类型。这可以避免不必要的所有权转移和数据复制。

```rust
use std::path::Path;

fn has_extension_csv<P: AsRef<Path>>(path: P) -> bool {
    path.as_ref()
        .extension()
        .map_or(false, |ext| ext == "csv")
}

let path_str = "data.csv";
let path_buf = PathBuf::from("data.csv");
let path = Path::new("data.csv");

assert!(has_extension_csv(path_str));
assert!(has_extension_csv(path_buf));
assert!(has_extension_csv(path));
```

通过使用 `AsRef<Path>` trait，你可以让函数接受多种类型的输入。

### 使用 `PathBuf` 构建新路径或拼接路径

当你需要**创建、修改或拼接**路径时，`PathBuf` 是最佳选择。

```rust
use std::path::PathBuf;

fn create_log_file_path(base_dir: &str, log_file: &str) -> PathBuf {
    let mut path = PathBuf::from(base_dir);
    path.push("logs");
    path.push(log_file);
    path
}

let log_path = create_log_file_path("/var/www/my_app", "access.log");
// 在 Unix 上: /var/www/my_app/logs/access.log
// 在 Windows 上: \var\www\my_app\logs\access.log
println!("Log path: {}", log_path.display());
```

`push()` 方法会智能地处理路径分隔符，确保在不同平台上的正确性。

### 处理路径中的 UTF-8 编码问题

由于 `OsStr` 和 `OsString` 可能包含非 UTF-8 字节，直接转换为 `&str` 或 `String` 可能会失败。在这种情况下，你可以使用以下方法安全地处理：

- **`to_str()`**: 如果你需要一个 **`&str`**，并且可以确定路径是有效的 UTF-8，可以使用此方法。它返回 `Option<&str>`，如果转换失败则返回 `None`，这需要你用 `if let` 或 `match` 进行处理。
- **`to_string_lossy()`**: 如果你只为了**显示**或**调试**路径，并且可以容忍有损转换，可以使用此方法。它返回一个 `Cow<'_, str>` 类型，会将无效的 UTF-8 字符替换为 `U+FFFD �`，保证总是能得到一个有效的 `str`。
- **`.display()`**: 这是 `Path` 的方法，返回一个实现了 `Display` 的辅助类型。**这是打印路径时最推荐的方式**，因为它会在底层进行必要的有损转换，从而安全地打印任何路径。

```rust
use std::path::Path;

let path_invalid = Path::new(b"invalid\xc3\x28path"); // 模拟一个无效 UTF-8 路径

// to_str() 转换失败，返回 None
assert_eq!(path_invalid.to_str(), None);

// to_string_lossy() 进行有损转换
assert_eq!(path_invalid.to_string_lossy(), "invalid(path");

// .display() 是打印路径的最佳实践
println!("Path is: {}", path_invalid.display());
```

### 进行文件系统操作

`Path` 类型包含了大量与文件系统交互的方法，例如 `metadata()`、`read_dir()` 和 `canonicalize()`。

```rust
use std::fs;
use std::path::Path;

fn get_file_size<P: AsRef<Path>>(path: P) -> Result<u64, std::io::Error> {
    let metadata = fs::metadata(&path)?;
    Ok(metadata.len())
}

// 假设有一个文件 `Cargo.toml` 存在
let path = Path::new("Cargo.toml");
match get_file_size(path) {
    Ok(size) => println!("文件大小为: {} 字节", size),
    Err(e) => eprintln!("无法获取文件大小: {}", e),
}
```

这些方法都返回 `Result`，要求开发者显式处理可能发生的错误。

[std::path - Rust]: https://doc.rust-lang.org/std/path/index.html
[path::Path]: https://doc.rust-lang.org/std/path/struct.Path.html
[path::PathBuf]: https://doc.rust-lang.org/std/path/struct.PathBuf.html
