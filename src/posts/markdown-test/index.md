+++
date = '2025-01-01T00:00:00+08:00'
draft = false
title = 'Markdown代码块测试'
description = "测试代码块内的#注释是否正常显示"
categories = ["Test"]
tags = ["Test", "Markdown"]
+++

# 测试文章

这是一个用来测试代码块内 `#` 注释的文章。

## Shell代码测试

```shell
# 这是一个注释
git config --global user.name "Name"
# 另一个注释
git config --global user.email "email@example.com"
```

## JavaScript代码测试

```javascript
// 这是JS注释，不应该受影响
function test() {
    // 另一个注释
    console.log("Hello world");
}
```

## Python代码测试

```python
# 这是Python注释
def hello():
    # 另一个注释
    print("Hello world")
```

## 缩进代码块测试

    # 这也是注释
    git status
    # 不应该被解析为标题

## 行内代码测试

在行内代码中：`#这不是标题`，应该正常显示。

## 正常标题

这个标题应该正常显示。
