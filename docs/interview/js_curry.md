---
title: 手动实现函数柯理化
group: Javascript
toc: content
---

## 定义

函数柯理化是指把接受多个参数的函数变换成接受一个单一参数（最初函数的第一个参数）
的函数。并且返回可接受余下的参数而且反回结果的新函数的技术。

具体实现如下：

### 简单版

```js
function curry(x) {
  return function (y) {
    return function (z) {
      return x + y + z;
    };
  };
}
```

### 面试版

```js
function add() {
  // let args = arguments; // 第一个括号里的参数 // 但args不是一个数组，要进行数组转换
  let args = [...arguments]; // args接收第一个括号里的参数

  let inner = function () {
    // 接收第二个括号里的参数
    args.push(...arguments); // 将第二个括号里的参数push到args中
    return inner;
  };
  // 重写函数的toString方法，利用它返回计算值
  inner.toString = function () {
    return args.reduce((prev, current) => {
      return prev + current;
    }, 0);
  };
  return inner;
}
```

### 函数柯理化的优点

- 柯里化之后，我们没有丢失任何参数：log 依然可以被正常调用。
- 我们可以轻松地生成偏函数，例如用于生成今天的日志的偏函数。
- 入口单一。
- 易于测试和复用。

### 函数柯理化的不好处

- 函数嵌套多
- 占内存，有可能导致内存泄漏（因为本质是配合闭包实现的）
- 效率差（因为使用递归）
- 变量存取慢，访问性很差（因为使用了 arguments）
