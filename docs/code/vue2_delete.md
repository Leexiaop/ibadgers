---
title: 实例方法篇delete
order: 23
group: vue2
toc: content
---

## vm.\$delete

`vm.$delete` 是全局 `Vue.delete`的**别名**，其用法相同。

### 用法回顾

在介绍方法的内部原理之前，我们先根据官方文档示例回顾一下它的用法。

```javascript
vm.$delete(target, propertyName / index);
```

- **参数**：

  - `{Object | Array} target`
  - `{string | number} propertyName/index`

  > 仅在 2.2.0+ 版本中支持 Array + index 用法。

- **用法**：

  删除对象的属性。如果对象是响应式的，确保删除能触发更新视图。这个方法主要用于
  避开 `Vue` 不能检测到属性被删除的限制，但是你应该很少会使用它。

  > 在 2.2.0+ 中同样支持在数组上工作。

* **注意**： 目标对象不能是一个 `Vue` 实例或 `Vue` 实例的根数据对象。

### 内部原理

`delete`方法是用来解决 `Vue` 不能检测到属性被删除的限制，该方法的定义位于源码
的`src/core.observer/index.js`中，如下：

```javascript
export function del(target, key) {
  if (
    process.env.NODE_ENV !== 'production' &&
    (isUndef(target) || isPrimitive(target))
  ) {
    warn(
      `Cannot delete reactive property on undefined, null, or primitive value: ${(target: any)}`,
    );
  }
  if (Array.isArray(target) && isValidArrayIndex(key)) {
    target.splice(key, 1);
    return;
  }
  const ob = (target: any).__ob__;
  if (target._isVue || (ob && ob.vmCount)) {
    process.env.NODE_ENV !== 'production' &&
      warn(
        'Avoid deleting properties on a Vue instance or its root $data ' +
          '- just set it to null.',
      );
    return;
  }
  if (!hasOwn(target, key)) {
    return;
  }
  delete target[key];
  if (!ob) {
    return;
  }
  ob.dep.notify();
}
```

该方法的内部原理与`set`方法有几分相似，都是根据不同情况作出不同处理。

首先判断在非生产环境下如果传入的`target`不存在，或者`target`是原始值，则抛出警告
，如下：

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

接着判断如果传入的`target`是数组并且传入的`key`是有效索引的话，就使用数组
的`splice`方法将索引`key`对应的值删掉，为什么要用`splice`方法上文中也解释了，就
是因为数组的`splice`方法已经被我们创建的拦截器重写了，所以使用该方法会自动通知相
关依赖。如下：

```javascript
if (Array.isArray(target) && isValidArrayIndex(key)) {
  target.splice(key, 1);
  return;
}
```

如果传入的`target`不是数组，那就当做对象来处理。

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

接着判断传入的`key`是否存在于`target`中，如果`key`本来就不存在于`target`中，那就
不用删除，直接退出程序即可，如下：

```javascript
if (!hasOwn(target, key)) {
  return;
}
```

最后，如果`target`是对象，并且传入的`key`也存在于`target`中，那么就从`target`中
将该属性删除，同时判断当前的`target`是否为响应式对象，如果是响应式对象，则通知依
赖更新；如果不是，删除完后直接返回不通知更新，如下：

```javascript
delete target[key];
if (!ob) {
  return;
}
ob.dep.notify();
```

以上，就是`delete`方法的内部原理。
