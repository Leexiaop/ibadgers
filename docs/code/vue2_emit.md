---
title: 实例方法篇emit
order: 24
group: vue2
toc: content
---

## vm.$emit

### 用法回顾

在介绍方法的内部原理之前，我们先根据官方文档示例回顾一下它的用法。

```javascript
vm.$emit( eventName, […args] )
```

- **参数**：
  - `{string} eventName`
  - `[...args]`
- **作用**：触发当前实例上的事件。附加参数都会传给监听器回调。

### 内部原理

该方法接收的第一个参数是要触发的事件名，之后的附加参数都会传给被触发事件的回调函
数。该方法的定义位于源码的`src/core/instance/event.js`中，如下：

```javascript
Vue.prototype.$emit = function (event: string): Component {
    const vm: Component = this
    let cbs = vm._events[event]
    if (cbs) {
		cbs = cbs.length > 1 ? toArray(cbs) : cbs
		const args = toArray(arguments, 1)
		for (let i = 0, l = cbs.length; i < l; i++) {
			try {
				cbs[i].apply(vm, args)
			} catch (e) {
				handleError(e, vm, `event handler for "${event}"`)
			}
		}
    }
    return vm
  	}
}
```

该方法的逻辑很简单，就是根据传入的事件名从当前实例的`_events`属性（即事件中心）
中获取到该事件名所对应的回调函数`cbs`，如下：

```javascript
let cbs = vm._events[event];
```

然后再获取传入的附加参数`args`，如下：

```javascript
const args = toArray(arguments, 1);
```

由于`cbs`是一个数组，所以遍历该数组，拿到每一个回调函数，执行回调函数并将附加参
数`args`传给该回调。如下：

```javascript
for (let i = 0, l = cbs.length; i < l; i++) {
  try {
    cbs[i].apply(vm, args);
  } catch (e) {
    handleError(e, vm, `event handler for "${event}"`);
  }
}
```

以上，就是`$emit`方法的内部原理。
