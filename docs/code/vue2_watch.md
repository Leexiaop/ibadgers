---
title: 实例方法篇watch
order: 29
group: vue2
toc: content
---

## vm.\$watch

### 用法回顾

在介绍方法的内部原理之前，我们先根据官方文档示例回顾一下它的用法。

```javascript
vm.$watch(expOrFn, callback, [options]);
```

- **参数**：

  - `{string | Function} expOrFn`
  - `{Function | Object} callback`
  - `{Object} [options]`
    - `{boolean} deep`
    - `{boolean} immediate`

- **返回值**：`{Function} unwatch`

- **用法**：

  观察 `Vue` 实例变化的一个表达式或计算属性函数。回调函数得到的参数为新值和旧
  值。表达式只接受监督的键路径。对于更复杂的表达式，用一个函数取代。

  注意：在变异 (不是替换) 对象或数组时，旧值将与新值相同，因为它们的引用指向同
  一个对象/数组。`Vue` 不会保留变异之前值的副本。

- **示例**：

  ```javascript
  // 键路径
  vm.$watch('a.b.c', function (newVal, oldVal) {
    // 做点什么
  });

  // 函数
  vm.$watch(
    function () {
      // 表达式 `this.a + this.b` 每次得出一个不同的结果时
      // 处理函数都会被调用。
      // 这就像监听一个未被定义的计算属性
      return this.a + this.b;
    },
    function (newVal, oldVal) {
      // 做点什么
    },
  );
  ```

  `vm.$watch` 返回一个取消观察函数，用来停止触发回调：

  ```javascript
  var unwatch = vm.$watch('a', cb);
  // 之后取消观察
  unwatch();
  ```

- **选项：deep**

  为了发现对象内部值的变化，可以在选项参数中指定 `deep: true` 。注意监听数组的
  变动不需要这么做。

  ```javascript
  vm.$watch('someObject', callback, {
    deep: true,
  });
  vm.someObject.nestedValue = 123;
  // callback is fired
  ```

- **选项：immediate**

  在选项参数中指定 `immediate: true` 将立即以表达式的当前值触发回调：

  ```javascript
  vm.$watch('a', callback, {
    immediate: true,
  });
  // 立即以 `a` 的当前值触发回调
  ```

  注意在带有 `immediate` 选项时，你不能在第一次回调时取消侦听给定的 property。

  ```javascript
  // 这会导致报错
  var unwatch = vm.$watch(
    'value',
    function () {
      doSomething();
      unwatch();
    },
    { immediate: true },
  );
  ```

  如果你仍然希望在回调内部调用一个取消侦听的函数，你应该先检查其函数的可用性：

  ```javascript
  var unwatch = vm.$watch(
    'value',
    function () {
      doSomething();
      if (unwatch) {
        unwatch();
      }
    },
    { immediate: true },
  );
  ```

### 内部原理

`$watch`的定义位于源码的`src/core/instance/state.js`中，如下：

```javascript
Vue.prototype.$watch = function (expOrFn, cb, options) {
  const vm: Component = this;
  if (isPlainObject(cb)) {
    return createWatcher(vm, expOrFn, cb, options);
  }
  options = options || {};
  options.user = true;
  const watcher = new Watcher(vm, expOrFn, cb, options);
  if (options.immediate) {
    cb.call(vm, watcher.value);
  }
  return function unwatchFn() {
    watcher.teardown();
  };
};
```

可以看到，`$watch`方法的代码并不多，逻辑也不是很复杂。

在函数内部，首先判断传入的回调函数是否为一个对象，就像下面这种形式：

```javascript
vm.$watch('a.b.c', {
  handler: function (val, oldVal) {
    /* ... */
  },
  deep: true,
});
```

如果传入的回调函数是个对象，那就表明用户是把第二个参数回调函数`cb`和第三个参数选
项`options`合起来传入的，此时调用`createWatcher`函数，该函数定义如下：

```javascript
function createWatcher(vm, expOrFn, handler, options) {
  if (isPlainObject(handler)) {
    options = handler;
    handler = handler.handler;
  }
  if (typeof handler === 'string') {
    handler = vm[handler];
  }
  return vm.$watch(expOrFn, handler, options);
}
```

可以看到，该函数内部其实就是从用户合起来传入的对象中把回调函数`cb`和参
数`options`剥离出来，然后再以常规的方式调用`$watch`方法并将剥离出来的参数穿进去
。

接着获取到用户传入的`options`，如果用户没有传入则将其赋值为一个默认空对象，如下
：

```javascript
options = options || {};
```

`$watch`方法内部会创建一个`watcher`实例，由于该实例是用户手动调用`$watch`方法创
建而来的，所以给`options`添加`user`属性并赋值为`true`，用于区分用户创建
的`watcher`实例和`Vue`内部创建的`watcher`实例，如下：

```javascript
options.user = true;
```

接着，传入参数创建一个`watcher`实例，如下：

```javascript
const watcher = new Watcher(vm, expOrFn, cb, options);
```

接着判断如果用户在选项参数`options`中指定的`immediate`为`true`，则立即用被观察数
据当前的值触发回调，如下：

```javascript
if (options.immediate) {
  cb.call(vm, watcher.value);
}
```

最后返回一个取消观察函数`unwatchFn`，用来停止触发回调。如下：

```javascript
return function unwatchFn() {
  watcher.teardown();
};
```

这个取消观察函数`unwatchFn`内部其实是调用了`watcher`实例的`teardown`方法，那么我
们来看一下这个`teardown`方法是如何实现的。其代码如下：

```javascript
export default class Watcher {
  constructor(/* ... */) {
    // ...
    this.deps = [];
  }
  teardown() {
    let i = this.deps.length;
    while (i--) {
      this.deps[i].removeSub(this);
    }
  }
}
```

在之前介绍变化侦测篇的文章中我们说过，谁读取了数据，就表示谁依赖了这个数据，那么
谁就会存在于这个数据的依赖列表中，当这个数据变化时，就会通知谁。也就是说，如果谁
不想依赖这个数据了，那么只需从这个数据的依赖列表中把谁删掉即可。

在上面代码中，创建`watcher`实例的时候会读取被观察的数据，读取了数据就表示依赖了
数据，所以`watcher`实例就会存在于数据的依赖列表中，同时`watcher`实例也记录了自己
依赖了哪些数据，另外我们还说过，每个数据都有一个自己的依赖管理
器`dep`，`watcher`实例记录自己依赖了哪些数据其实就是把这些数据的依赖管理
器`dep`存放在`watcher`实例的`this.deps = []`属性中，当取消观察时即`watcher`实例
不想依赖这些数据了，那么就遍历自己记录的这些数据的依赖管理器，告诉这些数据可以从
你们的依赖列表中把我删除了。

举个例子：

```javascript
vm.$watch(
  function () {
    return this.a + this.b;
  },
  function (newVal, oldVal) {
    // 做点什么
  },
);
```

例如上面`watcher`实例，它观察了数据`a`和数据`b`，那么它就依赖了数据`a`和数
据`b`，那么这个`watcher`实例就存在于数据`a`和数据`b`的依赖管理器`depA`和`depB`中
，同时`watcher`实例的`deps`属性中也记录了这两个依赖管理器，
即`this.deps=[depA,depB]`，

当取消观察时，就遍历`this.deps`，让每个依赖管理器调用其`removeSub`方法将这
个`watcher`实例从自己的依赖列表中删除。

下面还有最后一个问题，当选项参数`options`中的`deep`属性为`true`时，如何实现深度
观察呢？

首先我们来看看什么是深度观察，假如有如下被观察的数据：

```javascript
obj = {
  a: 2,
};
```

所谓深度观察，就是当`obj`对象发生变化时我们会得到通知，通知当`obj.a`属性发生变化
时我们也要能得到通知，简单的说就是观察对象内部值的变化。

要实现这个功能也不难，我们知道，要想让数据变化时通知我们，那我们只需成为这个数据
的依赖即可，因为数据变化时会通知它所有的依赖，那么如何成为数据的依赖呢，很简单，
读取一下数据即可。也就是说我们只需在创建`watcher`实例的时候把`obj`对象内部所有的
值都递归的读一遍，那么这个`watcher`实例就会被加入到对象内所有值的依赖列表中，之
后当对象内任意某个值发生变化时就能够得到通知了。

有了初步的思想后，接下来我们看看代码中是如何实现的。我们知道，在创建`watcher`实
例的时候，会执行`Watcher`类中`get`方法来读取一下被观察的数据，如下：

```javascript
export default class Watcher {
  constructor(/* ... */) {
    // ...
    this.value = this.get();
  }
  get() {
    // ...
    // "touch" every property so they are all tracked as
    // dependencies for deep watching
    if (this.deep) {
      traverse(value);
    }
    return value;
  }
}
```

可以看到，在`get`方法中，如果传入的`deep`为`true`，则会调用`traverse`函数，并且
在源码中，对于这一步操作有个很形象的注释：

```text
"touch" every property so they are all tracked as dependencies for deep watching

“触摸”每个属性，以便将它们全部作为深度监视的依赖项进行跟踪
```

所谓“触摸”每个属性，不就是将每个属性都读取一遍么？哈哈

回到代码，`traverse`函数定义如下：

```javascript
const seenObjects = new Set();

export function traverse(val: any) {
  _traverse(val, seenObjects);
  seenObjects.clear();
}

function _traverse(val: any, seen: SimpleSet) {
  let i, keys;
  const isA = Array.isArray(val);
  if (
    (!isA && !isObject(val)) ||
    Object.isFrozen(val) ||
    val instanceof VNode
  ) {
    return;
  }
  if (val.__ob__) {
    const depId = val.__ob__.dep.id;
    if (seen.has(depId)) {
      return;
    }
    seen.add(depId);
  }
  if (isA) {
    i = val.length;
    while (i--) _traverse(val[i], seen);
  } else {
    keys = Object.keys(val);
    i = keys.length;
    while (i--) _traverse(val[keys[i]], seen);
  }
}
```

可以看到，该函数其实就是个递归遍历的过程，把被观察数据的内部值都递归遍历读取一遍
。

首先先判断传入的`val`类型，如果它不是`Array`或`object`，再或者已经被冻结，那么直
接返回，退出程序。如下：

```javascript
const isA = Array.isArray(val);
if ((!isA && !isObject(val)) || Object.isFrozen(val) || val instanceof VNode) {
  return;
}
```

然后拿到`val`的`dep.id`，存入创建好的集合`seen`中，因为集合相比数据而言它有天然
的去重效果，以此来保证存入的`dep.id`没有重复，不会造成重复收集依赖，如下：

```javascript
if (val.__ob__) {
  const depId = val.__ob__.dep.id;
  if (seen.has(depId)) {
    return;
  }
  seen.add(depId);
}
```

接下来判断如果是数组，则循环数组，将数组中每一项递归调用`_traverse`；如果是对象
，则取出对象所有的`key`，然后执行读取操作，再递归内部值，如下：

```javascript
if (isA) {
  i = val.length;
  while (i--) _traverse(val[i], seen);
} else {
  keys = Object.keys(val);
  i = keys.length;
  while (i--) _traverse(val[keys[i]], seen);
}
```

这样，把被观察数据内部所有的值都递归的读取一遍后，那么这个`watcher`实例就会被加
入到对象内所有值的依赖列表中，之后当对象内任意某个值发生变化时就能够得到通知了。
