+++
title = "Markdown 解析测试"
description = "测试 LaTeX 数学公式和 SnackText 语法解析"
date = "2025-01-12"
categories = ["test"]
tags = ["markdown", "latex", "test"]
draft = false
+++

# Markdown 解析功能测试

这个文档用来测试新的 Markdown 解析功能。

## SnackText 语法测试

以下是 SnackText 语法的测试：

正常的标题：
# 这是一个标题（# 后有空格）

SnackText 语法：
#这是SnackText #另一个SnackText #第三个测试

混合测试：
这里有一些文本 #标签一 和更多文本 #标签二 在同一行。

## LaTeX 数学公式测试

### 行内公式

这是一个行内公式：$E = mc^2$，这是爱因斯坦的质能方程。

另一个例子：当 $a \neq 0$ 时，二次方程 $ax^2 + bx + c = 0$ 的解为：$x = \frac{-b \pm \sqrt{b^2-4ac}}{2a}$

### 块级公式

这是一个块级公式：

$$
\int_{-\infty}^{\infty} e^{-x^2} dx = \sqrt{\pi}
$$

另一个复杂的例子：

$$
\begin{align}
\nabla \times \vec{\mathbf{B}} -\, \frac1c\, \frac{\partial\vec{\mathbf{E}}}{\partial t} &= \frac{4\pi}{c}\vec{\mathbf{j}} \\
\nabla \cdot \vec{\mathbf{E}} &= 4 \pi \rho \\
\nabla \times \vec{\mathbf{E}}\, +\, \frac1c\, \frac{\partial\vec{\mathbf{B}}}{\partial t} &= \vec{\mathbf{0}} \\
\nabla \cdot \vec{\mathbf{B}} &= 0
\end{align}
$$

### 矩阵示例

$$
\begin{pmatrix}
a & b \\
c & d
\end{pmatrix}
\begin{pmatrix}
x \\
y
\end{pmatrix}
=
\begin{pmatrix}
ax + by \\
cx + dy
\end{pmatrix}
$$

## 混合内容测试

在这个段落中，我们同时测试 #SnackText 和数学公式 $f(x) = x^2$ 的解析效果。

更多的 #标签测试 和公式 $\sum_{i=1}^{n} i = \frac{n(n+1)}{2}$ 在同一行。

## 代码和其他元素

```javascript
// 这是代码块，不应该被影响
function test() {
    console.log('#这不是SnackText');
    return "正常代码";
}
```

> 这是引用块
> #这里的井号应该被解析为SnackText
> 数学公式也应该工作：$\alpha + \beta = \gamma$

- 列表项 1 #标签
- 列表项 2 含有公式 $y = mx + b$
- 列表项 3

测试结束！
