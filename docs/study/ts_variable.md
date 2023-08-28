---
title: 变量声明
order: 2
group: TypeScript
toc: content
---

Typescript 变量的声明和 Javascript 变量的声明没有什么区别，主要还是通过三个关键
字来声明：`var、let、const`，所以，我们只需要关注 var,let,const 声明变量时的情况
即可。

#### 重复是声明

var 关键字声明的变量可以不计次数的声明，也就是说，声明多少次都可以；let 和 const
声明的变量只能声明一次，如果多次声明就会报错。

```ts
var a = 1;
var a = 2;

let m = 1;
let m = 3; //  Uncaught SyntaxError: Identifier 'a' has already been declared

const s = 2;
const s = 4; //  Uncaught SyntaxError: Identifier 'a' has already been declared
```

#### 作用域问题

var 声明的变量存在变量提升的情况，也就是说 var 声明的变量会提升到所在作用域的最
顶层，而 let 和 const 声明的变量则不会

```ts
console.log(a); //  undefined
var a = 5;
console.log(a); //  5

console.log(m); //  Uncaught ReferenceError: m is not defined
let m = 4;
console.log(m); //  4
```

#### 块级作用域

块作用域由 { }包括，let 和 const 具有块级作用域，var 不存在块级作用域。

```ts
console.log(a); //  undefined
if (true) {
  var a = 5;
}
console.log(a); //  5

console.log(m); //  Uncaught ReferenceError: m is not defined
if (true) {
  let m = 4;
}
console.log(m); //  Uncaught ReferenceError: m is not defined
```

#### 全局作用域

var 声明的变量会添加到全局作用域中，window/global 上，而 let 和 const 则不会

```ts
var a = 4;
console.log(window.a); //  4

let m = 5;
console.log(window.m); //  undefined
```

#### const 声明的变量可更改吗？

const 保证的并不是变量的值不能改动，而是变量指向的那个内存地址不能改动。对于基本
类型的数据（数值、字符串、布尔值），其值就保存在变量指向的那个内存地址，因此等同
于常量。但对于引用类型的数据（主要是对象和数组）来说，变量指向数据的内存地址，保
存的只是一个指针，const 只能保证这个指针是固定不变的，至于它指向的数据结构是不是
可变的，就完全不能控制了。
