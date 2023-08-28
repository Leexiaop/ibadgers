---
title: 实例方法篇off
order: 25
group: vue2
toc: content
---

## vm.$off

### 用法回顾

在介绍方法的内部原理之前，我们先根据官方文档示例回顾一下它的用法。

```javascript
vm.$off([event, callback]);
```

- **参数**：

  - `{string | Array<string>} event` (只在 2.2.2+ 支持数组)
  - `{Function} [callback]`

- **作用**：

  移除自定义事件监听器。

  - 如果没有提供参数，则移除所有的事件监听器；
  - 如果只提供了事件，则移除该事件所有的监听器；
  - 如果同时提供了事件与回调，则只移除这个回调的监听器。

### 内部原理

通过用法回顾我们知道，该方法用来移除事件中心里面某个事件的回调函数，根据所传入参
数的不同，作出不同的处理。该方法的定义位于源码的`src/core/instance/event.js`中，
如下：

```javascript
Vue.prototype.$off = function (event, fn) {
  const vm: Component = this;
  // all
  if (!arguments.length) {
    vm._events = Object.create(null);
    return vm;
  }
  // array of events
  if (Array.isArray(event)) {
    for (let i = 0, l = event.length; i < l; i++) {
      this.$off(event[i], fn);
    }
    return vm;
  }
  // specific event
  const cbs = vm._events[event];
  if (!cbs) {
    return vm;
  }
  if (!fn) {
    vm._events[event] = null;
    return vm;
  }
  if (fn) {
    // specific handler
    let cb;
    let i = cbs.length;
    while (i--) {
      cb = cbs[i];
      if (cb === fn || cb.fn === fn) {
        cbs.splice(i, 1);
        break;
      }
    }
  }
  return vm;
};
```

可以看到，在该方法内部就是通过不断判断所传参数的情况进而进行不同的逻辑处理，接下
来我们逐行分析。

首先，判断如果没有传入任何参数（即`arguments.length`为 0），这就是第一种情况：如
果没有提供参数，则移除所有的事件监听器。我们知道，当前实例上的所有事件都存储在事
件中心`_events`属性中，要想移除所有的事件，那么只需把`_events`属性重新置为空对象
即可。如下：

```javascript
if (!arguments.length) {
  vm._events = Object.create(null);
  return vm;
}
```

接着，判断如果传入的需要移除的事件名是一个数组，就表示需要一次性移除多个事件，那
么我们只需同订阅多个事件一样，遍历该数组，然后将数组中的每一个事件都递归调
用`$off`方法进行移除即可。如下：

```javascript
if (Array.isArray(event)) {
  for (let i = 0, l = event.length; i < l; i++) {
    this.$off(event[i], fn);
  }
  return vm;
}
```

接着，获取到需要移除的事件名在事件中心中对应的回调函数`cbs`。如下：

```javascript
const cbs = vm._events[event];
```

接着，判断如果`cbs`不存在，那表明在事件中心从来没有订阅过该事件，那就谈不上移除
该事件，直接返回，退出程序即可。如下：

```javascript
if (!cbs) {
  return vm;
}
```

接着，如果`cbs`存在，但是没有传入回调函数`fn`，这就是第二种情况：如果只提供了事
件，则移除该事件所有的监听器。这个也不难，我们知道，在事件中心里面，一个事件名对
应的回调函数是一个数组，要想移除所有的回调函数我们只需把它对应的数组设置
为`null`即可。如下：

```javascript
if (!fn) {
  vm._events[event] = null;
  return vm;
}
```

接着，如果既传入了事件名，又传入了回调函数，`cbs`也存在，那这就是第三种情况：如
果同时提供了事件与回调，则只移除这个回调的监听器。那么我们只需遍历所有回调函数数
组`cbs`，如果`cbs`中某一项与`fn`相同，或者某一项的`fn`属性与`fn`相同，那么就将其
从数组中删除即可。如下：

```javascript
if (fn) {
  // specific handler
  let cb;
  let i = cbs.length;
  while (i--) {
    cb = cbs[i];
    if (cb === fn || cb.fn === fn) {
      cbs.splice(i, 1);
      break;
    }
  }
}
```

以上，就是`$off`方法的内部原理。
