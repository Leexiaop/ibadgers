---
title: 手动实现bind, call, apply方法并简述区别？
group: Javascript
toc: content
---

## apply、call、bind 的异同点

### 相同点

- js 中 bind、call、apply 都是用来改变当前函数中 this 指向的。

### 不同点

- 执行方式不同 call 和 apply 加载后立即执行，是同步代码，bind 是异步代码，改变
  后不会立即执行；而是返回一个新的函数。
- 传参方式不同 call 和 bind 传参是一个一个逐一传入，不能使用剩余参数的方式传参
  。apply 可以使用数组的方式传入的，只要是数组方式就可以使用剩余参数的方式传入
  。
- 修改 this 的性质不同 call、apply 只是临时的修改一次，也就是 call 和 apply 方
  法的那一次；当再次调用原函数的时候，它的指向还是原来的指向。bind 是永久修改
  函数 this 指向，但是它修改的不是原来的函数；而是返回一个修改过后新的函数，此
  函数的 this 永远被改变了，绑定了就修改不了。

## 手动实现 bind、call 和 apply 方法

### bind 方法的实现

```js
Function.prototype.bind = function (context) {
    //  如果调用bind方法的不是一个function，直接抛出错误
    if (typeif this !== 'function') {
        throw new TypeError("Function.prototype.bind - what is trying to be bound is not callable");
    }
    //  取出bind方法中传入的除第一个参数（第一个参数是需要绑定的this）外的其余参数存在args数组中
    let args = Array.prototype.slice.call(arguments, 1);
    //  这里的this是指向调用bind方法的函数
    let self = this;
    return function () {
        //  获取执行bind函数传入的参数
        let innerArgs = Array.prototype.slice.call(arguments);
        //  将第二个括号中的参数concat进args得到除第一个参数外所有传入的参数（这里有两个知识点：1、因为闭包args参数的值一直存在在内存中；2、偏函数（和函数柯里化相似但有点不同））
        let finialArgs = args.concat(innerArgs);
        //  调用apply方法，return函数结果
        return self.apply(context, finialArgs);
    }
}
```

### call 方法的实现

```js
Function.prototype.call = function (obj) {
  //  绑定的对象可能是一个Object的this,或者是一个方法的this,也可能使null,如果是null，那么就绑定调用者本身
  const self = obj || this;
  //  此时的self为调用者需要改变this指向的目标，在其上面绑定调用者方法，即该方法的this也跟着改变了
  self.fn = this;
  //  获取剩余参数
  const [, ...arg] = arguments;
  //  执行方法
  const result = this.fn(...arg);
  //对象是引用传递，我们不能改变传进来的参数，所以我们要从传进来的参数身上把我们通过this绑定的方法删除掉。
  delete self.fun;
  return result;
};
```

### apply 方法的实现

```js
Function.prototype.apply = function (obj, args) {
  const self = obj || this;
  self.fn = this;
  const result = self.fn(args);
  delete self.fn;
  return result;
};
```
