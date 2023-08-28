---
title: 实例方法篇on
order: 26
group: vue2
toc: content
---

## vm.$on

### 用法回顾

在介绍方法的内部原理之前，我们先根据官方文档示例回顾一下它的用法。

```javascript
vm.$on(event, callback);
```

- **参数**：

  - `{string | Array<string>} event` (数组只在 2.2.0+ 中支持)
  - `{Function} callback`

- **作用**：

  监听当前实例上的自定义事件。事件可以由`vm.$emit`触发。回调函数会接收所有传入
  事件触发函数的额外参数。

- **示例**：

  ```javascript
  vm.$on('test', function (msg) {
    console.log(msg);
  });
  vm.$emit('test', 'hi');
  // => "hi"
  ```

### 内部原理

在介绍内部原理之前，我们先有一个这样的概念：`$on`和`$emit`这两个方法的内部原理是
设计模式中最典型的发布订阅模式，首先定义一个事件中心，通过`$on`订阅事件，将事件
存储在事件中心里面，然后通过`$emit`触发事件中心里面存储的订阅事件。

OK，有了这个概念之后，接下来，我们就先来看看`$on`方法的内部原理。该方法的定义位
于源码的`src/core/instance/event.js`中，如下：

```javascript
Vue.prototype.$on = function (event, fn) {
  const vm: Component = this;
  if (Array.isArray(event)) {
    for (let i = 0, l = event.length; i < l; i++) {
      this.$on(event[i], fn);
    }
  } else {
    (vm._events[event] || (vm._events[event] = [])).push(fn);
  }
  return vm;
};
```

`$on`方法接收两个参数，第一个参数是订阅的事件名，可以是数组，表示订阅多个事件。
第二个参数是回调函数，当触发所订阅的事件时会执行该回调函数。

首先，判断传入的事件名是否是一个数组，如果是数组，就表示需要一次性订阅多个事件，
就遍历该数组，将数组中的每一个事件都递归调用`$on`方法将其作为单个事件订阅。如下
：

```javascript
if (Array.isArray(event)) {
  for (let i = 0, l = event.length; i < l; i++) {
    this.$on(event[i], fn);
  }
}
```

如果不是数组，那就当做单个事件名来处理，以该事件名作为`key`，先尝试在当前实例
的`_events`属性中获取其对应的事件列表，如果获取不到就给其赋空数组为默认值，并将
第二个参数回调函数添加进去。如下：

```javascript
else {
    (vm._events[event] || (vm._events[event] = [])).push(fn)
}
```

那么问题来了，当前实例的`_events`属性是干嘛的呢？

还记得我们在介绍生命周期初始化阶段的初始化事件`initEvents`函数中，在该函数中，首
先在当前实例上绑定了`_events`属性并给其赋值为空对象，如下：

```javascript
export function initEvents(vm: Component) {
  vm._events = Object.create(null);
  // ...
}
```

这个`_events`属性就是用来作为当前实例的事件中心，所有绑定在这个实例上的事件都会
存储在事件中心`_events`属性中。

以上，就是`$on`方法的内部原理。
