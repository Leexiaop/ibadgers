---
title: 实例方法篇once
order: 27
group: vue2
toc: content
---

## vm.$once

### 用法回顾

在介绍方法的内部原理之前，我们先根据官方文档示例回顾一下它的用法。

```javascript
vm.$once(event, callback);
```

- **参数**：

  - `{string} event`
  - `{Function} callback`

- **作用**：

  监听一个自定义事件，但是只触发一次。一旦触发之后，监听器就会被移除。

### 内部原理

该方法的作用是先订阅事件，但是该事件只能触发一次，也就是说当该事件被触发后会立即
移除。要实现这个功能也不难，我们可以定义一个子函数，用这个子函数来替换原本订阅事
件所对应的回调，也就是说当触发订阅事件时，其实执行的是这个子函数，然后再子函数内
部先把该订阅移除，再执行原本的回调，以此来达到只触发一次的目的。

下面我们就来看下源码的实现。该方法的定义位于源码的`src/core/instance/event.js`中
，如下：

```javascript
Vue.prototype.$once = function (event, fn) {
  const vm: Component = this;
  function on() {
    vm.$off(event, on);
    fn.apply(vm, arguments);
  }
  on.fn = fn;
  vm.$on(event, on);
  return vm;
};
```

可以看到，在上述代码中，被监听的事件是`event`，其原本对应的回调是`fn`，然后定义
了一个子函数`on`。

在该函数内部，先通过`$on`方法订阅事件，同时所使用的回调函数并不是原本的`fn`而是
子函数`on`，如下：

```javascript
vm.$on(event, on);
```

也就是说，当事件`event`被触发时，会执行子函数`on`。

然后在子函数内部先通过`$off`方法移除订阅的事件，这样确保该事件不会被再次触发，接
着执行原本的回调`fn`，如下：

```javascript
function on() {
  vm.$off(event, on);
  fn.apply(vm, arguments);
}
```

另外，还有一行代码`on.fn = fn`是干什么的呢？

上文我们说了，我们用子函数`on`替换了原本的订阅事件所对应的回调`fn`，那么在事件中
心`_events`属性中存储的该事件名就会变成如下这个样子：

```javascript
vm._events = {
  xxx: [on],
};
```

但是用户自己却不知道传入的`fn`被替换了，当用户在触发该事件之前想调用`$off`方法移
除该事件时：

```javascript
vm.$off('xxx', fn);
```

此时就会出现问题，因为在`_events`属性中的事件名`xxx`对应的回调函数列表中没
有`fn`，那么就会移除失败。这就让用户费解了，用户明明给`xxx`事件传入的回调函数
是`fn`，现在反而找不到`fn`导致事件移除不了了。

所以，为了解决这一问题，我们需要给`on`上绑定一个`fn`属性，属性值为用户传入的回
调`fn`，这样在使用`$off`移除事件的时候，`$off`内部会判断如果回调函数列表中某一项
的`fn`属性与`fn`相同时，就可以成功移除事件了。

以上，就是`$once`方法的内部原理。
