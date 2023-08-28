---
title: 手动实现new操作符
group: Javascript
toc: content
---

new 操作符就是通过构造函数创建一个对象，就这么简单。它具体做了以下几件事儿：

- 创建了一个空对象
- 将创建的空对象的隐士原型(**proto**)指向构造函数的原型对象(prototype)
- 把构造函数的 this 指向新创建的空对象，并且执行构造函数返回结果
- 判断返回的结果是不是引用类型，如果是引用类型则返回执行结果，new 操作失败，否
  则返回创建的新对象

```js
function myNew(Fn, ...args) {
  //  先创建一个新空对象
  let obj = {};
  //  把obj的__proto__指向构造函数
  Object.setPrototypeOf(obj, Fn.prototype);
  //  上面的俩步可以通过const obj = Object.create(Fn.prototype)实现
  //  改变构造函数的上下文（this）,并将参数传入
  let result = Fn.apply(obj, args);
  return result instanceof Object ? result : obj;
  // return typeof result === 'object' && result != null ? result : obj
}
```
