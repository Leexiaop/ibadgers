---
title: 实例方法篇set
order: 28
group: vue2
toc: content
---

## vm.\$set

`vm.$set` 是全局 `Vue.set` 的**别名**，其用法相同。

### 用法回顾

在介绍方法的内部原理之前，我们先根据官方文档示例回顾一下它的用法。

```javascript
vm.$set(target, propertyName / index, value);
```

- **参数**：

  - `{Object | Array} target`
  - `{string | number} propertyName/index`
  - `{any} value`

- **返回值**：设置的值。

- **用法**：

  向响应式对象中添加一个属性，并确保这个新属性同样是响应式的，且触发视图更新。
  它必须用于向响应式对象上添加新属性，因为 `Vue` 无法探测普通的新增属性 (比如
  `this.myObject.newProperty = 'hi'`)

- **注意**：对象不能是 `Vue` 实例，或者 `Vue` 实例的根数据对象。

### 内部原理

还记得我们在介绍数据变化侦测的时候说过，对于`object`型数据，当我们向`object`数据
里添加一对新的`key/value`或删除一对已有的`key/value`时，`Vue`是无法观测到的；而
对于`Array`型数据，当我们通过数组下标修改数组中的数据时，`Vue`也是是无法观测到的
；

正是因为存在这个问题，所以`Vue`设计了`set`和`delete`这两个方法来解决这一问题，下
面我们就先来看看`set`方法的内部实现原理。

`set`方法的定义位于源码的`src/core/observer/index.js`中，如下：

```javascript
export function set(target, key, val) {
  if (
    process.env.NODE_ENV !== 'production' &&
    (isUndef(target) || isPrimitive(target))
  ) {
    warn(
      `Cannot set reactive property on undefined, null, or primitive value: ${(target: any)}`,
    );
  }
  if (Array.isArray(target) && isValidArrayIndex(key)) {
    target.length = Math.max(target.length, key);
    target.splice(key, 1, val);
    return val;
  }
  if (key in target && !(key in Object.prototype)) {
    target[key] = val;
    return val;
  }
  const ob = (target: any).__ob__;
  if (target._isVue || (ob && ob.vmCount)) {
    process.env.NODE_ENV !== 'production' &&
      warn(
        'Avoid adding reactive properties to a Vue instance or its root $data ' +
          'at runtime - declare it upfront in the data option.',
      );
    return val;
  }
  if (!ob) {
    target[key] = val;
    return val;
  }
  defineReactive(ob.value, key, val);
  ob.dep.notify();
  return val;
}
```

可以看到，方法内部的逻辑并不复杂，就是根据不同的情况作出不同的处理。

首先判断在非生产环境下如果传入的`target`是否为`undefined`、`null`或是原始类型，
如果是，则抛出警告，如下：

```javascript
if (
  process.env.NODE_ENV !== 'production' &&
  (isUndef(target) || isPrimitive(target))
) {
  warn(
    `Cannot set reactive property on undefined, null, or primitive value: ${(target: any)}`,
  );
}
```

接着判断如果传入的`target`是数组并且传入的`key`是有效索引的话，那么就取当前数组
长度与`key`这两者的最大值作为数组的新长度，然后使用数组的`splice`方法将传入的索
引`key`对应的`val`值添加进数组。这里注意一点，为什么要用`splice`方法呢？还记得我
们在介绍`Array`类型数据的变化侦测方式时说过，数组的`splice`方法已经被我们创建的
拦截器重写了，也就是说，当使用`splice`方法向数组内添加元素时，该元素会自动被变成
响应式的。如下：

```javascript
if (Array.isArray(target) && isValidArrayIndex(key)) {
  target.length = Math.max(target.length, key);
  target.splice(key, 1, val);
  return val;
}
```

如果传入的`target`不是数组，那就当做对象来处理。

首先判断传入的`key`是否已经存在于`target`中，如果存在，表明这次操作不是新增属性
，而是对已有的属性进行简单的修改值，那么就只修改属性值即可，如下：

```javascript
if (key in target && !(key in Object.prototype)) {
  target[key] = val;
  return val;
}
```

接下来获取到`target`的`__ob__`属性，我们说过，该属性是否为`true`标志着`target`是
否为响应式对象，接着判断如果`tragte`是 `Vue` 实例，或者是 `Vue` 实例的根数据对象
，则抛出警告并退出程序，如下：

```javascript
const ob = (target: any).__ob__;
if (target._isVue || (ob && ob.vmCount)) {
  process.env.NODE_ENV !== 'production' &&
    warn(
      'Avoid adding reactive properties to a Vue instance or its root $data ' +
        'at runtime - declare it upfront in the data option.',
    );
  return val;
}
```

接着判断如果`ob`属性为`false`，那么表明`target`不是一个响应式对象，那么我们只需
简单给它添加上新的属性，不用将新属性转化成响应式，如下：

```javascript
if (!ob) {
  target[key] = val;
  return val;
}
```

最后，如果`target`是对象，并且是响应式，那么就调用`defineReactive`方法将新属性值
添加到`target`上，`defineReactive`方会将新属性添加完之后并将其转化成响应式，最后
通知依赖更新，如下：

```javascript
defineReactive(ob.value, key, val);
ob.dep.notify();
```

以上，就是`set`方法的内部原理。其逻辑流程图如下：

![set](http://leexiaop.github.io/static/ibadgers/code/vue2/method.jpg)
