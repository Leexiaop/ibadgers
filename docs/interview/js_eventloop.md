---
title: 事件循环是什么
group: Javascript
toc: content
---

## javascript 是单线程

JavaScript 是单线程的编程语言。只有一个调用栈，决定了他在同一时间只能做一件事情
。在代码执行的时候，通过将不同函数的执行上下文压入执行栈中来保证代码的有序执行。
在执行同步代码的时候，如果遇到了异步事件，js 引擎并不会一直等待其返回结果，而是
会将这个事件挂起，继续执行执行栈中的其他任务。因此 JS 又是一个非阻塞、异步、并发
式的编程语言。

## 同步和异步

`同步：`指的是在主线程上排队执行的任务，只有前一个任务执行完毕，才能执行后一个任
务。可以理解为在执行完一个函数或方法之后，一直等待系统返回值或消息，这时程序是处
于阻塞的，只有接收到返回的值或消息后才往下执行其他的命令。

`异步：`指的是不进入主线程，某个异步任务可以执行了，该任务才会进入主线程执行。执
行完函数或方法后，不必阻塞性地等待返回值或消息，只需要向系统委托一个异步过程，那
么当系统接收到返回值或消息时，系统会自动触发委托的异步过程，从而完成一个完整的流
程。

```js
console.log(1);
setTimeout(() => {
  console.log(2);
});
setTimeout(() => {
  console.log(3);
});
setTimeout(() => {
  console.log(4);
});
console.log(5);
```

以上代码输出的结果是：1,5,2,3,4;这是为什么呢？看事件循环的原理。

## 事件循环

事件循环过程可以简单的描述为：

- 函数入栈，当 stack 当中执行到异步任务的时候，就会将他丢到 WebAPIs，接着执行
  同步任务,直到 Stack 为空;
- 在此期间，WebAPIs 完成这个事件，然后把回掉函数放入到任务队列中等待；
- 当执行栈为空时，Event Loop 把任务队列中的一个任务放到 stack 中，重复第一步。

事件循环（Event Loop） 是让 JavaScript 做到既是单线程，又绝对不会阻塞的核心机制
，也是 JavaScript 并发模型（Concurrency Model）的基础，是用来协调各种事件、用户
交互、脚本执行、UI 渲染、网络请求等的一种机制。在执行和协调各种任务时，Event
Loop 会维护自己的事件队列。

事件队列是一个存储着待执行任务的队列，其中的任务严格按照时间先后顺序执行，排在队
头的任务将会率先执行，而排在队尾的任务会最后执行。事件队列每次仅执行一个任务，在
该任务执行完毕之后，再执行下一个任务,一个任务开始后直至结束，不会被其他任务中断
。执行栈则是一个类似于函数调用栈的运行容器，当执行栈为空时，JS 引擎便检查事件队
列，如果不为空的话，事件队列便将第一个任务压入执行栈中运行。

任务队列：在 JavaScript 中，异步任务被分为两种，一种宏任务（MacroTask）也叫
Task，一种叫微任务：

`宏任务:`包括创建主文档对象、解析 HTML、执行主线（或全局）JavaScript 代码，更改
当前 URL 以及各种事件，如页面加载、输入、网络事件和定时器事件。从浏览器的角度来
看，宏任务代表一个个离散的、独立工作单元。运行完任务后，浏览器可以继续其他调度，
如重新渲染页面的 UI 或执行垃圾回收。

`微任务:`微任务是更小的任务，微任务更新应用程序的状态，但必须在浏览器任务继续执
行其他任务之前执行，浏览器任务包括重新渲染页面的 UI。微任务的案例包括 promise 回
调函数、DOM 发生变化等。微任务需要尽可能快地、通过异步方式执行，同时不能产生全新
的微任务。微任务使得我们能够在重新渲染 UI 之前执行指定的行为，避免不必要的 UI 重
绘，UI 重绘会使应用程序的状态不连续。

当前执行栈中的事件执行完毕后，js 引擎首先会判断微任务对列中是否有任务可以执行，
如果有就将微任务队首的事件压入栈中执行。当微任务对列中的任务都执行完成后再去判断
宏任务对列中的任务。每次宏任务执行完毕，都会去判断微任务队列是否产生新任务，若存
在就优先执行微任务，否则按序执行宏任务。

事件循环通常至少需要两个任务队列：宏任务队列和微任务队列。两种队列在同一时刻都只
执行一个任务。

## 经典面试题

### 题目一

```js
async function async1() {
  console.log('async1 start');
  await async2();
  console.log('async1 end');
}
async function async2() {
  console.log('async2');
}
console.log('script start');
setTimeout(function () {
  console.log('setTimeout');
}, 0);
async1();
new Promise(function (resolve) {
  console.log('promise1');
  resolve();
}).then(function () {
  console.log('promise2');
});
console.log('script end');
// script start
// async1 start
// async2
// promise1
// script end
// async1 end
// promise2
// setTimeout
```

解析：

- 首先创建了 async1 和 async2 俩个函数，但是并没有被调用，先不用管
- 所以首先打印的是 script start
- 遇到了 setTimeout,那么这个 setTimeout 是一个异步任务的宏任务，一定是最后执行
  ，所以最后打印的是 setTimeout
- 紧接着 async1 被调用，我们知道 async/await 和 promise 一样，创建即会执行，所
  以，立刻输出 async1 start
- 紧接着 async2 被调用，那么就直接输出 async2
- await 之后是 async1 end，这里其实相当于是 promise 的 then 是一个异步任务的微
  任务，所以放到异步任务队列中
- promise，创建既执行，此时输出应该是 promise1
- promise 的 then 方法是异步任务，那么此时进入异步队列
- 输出 srcipt end
- 这时候，发现主线程的任务执行完了，那么就要开始执行异步任务队列的任务，只有
  async1 end，then 和 setTimeout，微任务优先于宏任务执行，setTimeout 最后执行
  ，所以答案如上。

### 题目二

```js
async function async1() {
  console.log('async1 start');
  await async2();
  console.log('async1 end');
}
async function async2() {
  //async2做出如下更改：
  new Promise(function (resolve) {
    console.log('promise1');
    resolve();
  }).then(function () {
    console.log('promise2');
  });
}
console.log('script start');

setTimeout(function () {
  console.log('setTimeout');
}, 0);
async1();

new Promise(function (resolve) {
  console.log('promise3');
  resolve();
}).then(function () {
  console.log('promise4');
});

console.log('script end');
//  script start
//  async1 start
//  promise1
//  promise3
//  script end
//  promise2
//  async1 end
//  promise4
//  setTimeout
```

解析：

- 首先创建了 async1 和 async2 函数但是并没有调用，所以首先输出的是 script
  start
- setTimeout 出现，这是一个异步任务的宏任务，所以是最后执行，那么也是最后输出
- 调用了 async1,那么此时就应该输出 async1 start
- 在 async1 中调用了 async2，而 async2 函数中是一个 promise,promise 创建即执行
  ，那么此时输出的应该是 promise1
- async2 的 promise 中有 then,then 是一个异步任务的微任务，所以此时，promise2
  应该是一部人物队列中的第一个要执行的
- async2 执行完成后，在 await 后面的就相当于是 promise.then，那么此时 async1
  end 再次加入到异步任务队列中
- async1 执行完后，创建了 promise,此时应该输出的是 promise3，
- promise4 就应该在此被压入到异步任务队列中
- 输出 script end，这时主线程的任务执行完毕，开始执行异步任务队列的宏任务
- 异步任务队列的执行顺序应该按照刚才押入的顺序， promise2，async1
  end，promise4
- 宏任务执行完毕后，执行微任务，setTimeout

### 题目三

```js
async function a1() {
  console.log('a1 start');
  await a2();
  console.log('a1 end');
}
async function a2() {
  console.log('a2');
}

console.log('script start');

setTimeout(() => {
  console.log('setTimeout');
}, 0);

Promise.resolve().then(() => {
  console.log('promise1');
});

a1();

let promise2 = new Promise((resolve) => {
  resolve('promise2.then');
  console.log('promise2');
});

promise2.then((res) => {
  console.log(res);
  Promise.resolve().then(() => {
    console.log('promise3');
  });
});
console.log('script end');
// script start
// a1 start
// a2
// promise2
// script end
// promise1
// a1 end
// promise2.then
// promise3
// setTimeout
```

解析：和以上题目异曲同工，不再解释。
