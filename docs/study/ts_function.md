---
title: 函数
order: 5
group: TypeScript
toc: content
---

typescript 中的函数和 JavaScript 中的函数如出一辙，但是 typescript 中的函数要比
JavaScript 中的函数更为复杂。

### 函数类型

#### 为函数定义类型

我们可以给每个参数添加类型之后再为函数本身添加返回值类型。 TypeScript 能够根据返
回语句自动推断出返回值类型，因此我们通常省略它。

```ts
function add(x: number, y: number): number {
  return x + y;
}

let myAdd = function (x: number, y: number): number {
  return x + y;
};
```
