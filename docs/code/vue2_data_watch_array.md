---
title: 数据侦听篇之数组
order: 3
group: vue2
toc: content
---

数组数据的侦听其实和对象侦听的思路没有什么变化，只不过 Object.defineProperty()方
法只能运用在 Object 上，而数组并没有这个方法，那么接下来，我们就看看 vue 是如何
对数组做侦听的。

```js
// 源码位置：src/core/observer/index.js

/**
 * Observer类会通过递归的方式把一个对象的所有属性都转化成可观测对象
 */
export class Observer {
  constructor(value) {
    this.value = value;
    // 给value新增一个__ob__属性，值为该value的Observer实例
    // 相当于为value打上标记，表示它已经被转化成响应式了，避免重复操作
    def(value, '__ob__', this);
    if (Array.isArray(value)) {
      // 当value为数组时的逻辑
      // ...
    } else {
      this.walk(value);
    }
  }

  walk(obj: Object) {
    const keys = Object.keys(obj);
    for (let i = 0; i < keys.length; i++) {
      defineReactive(obj, keys[i]);
    }
  }
}
```

在 Observer 类中，当判断是数组的时候，就是开始对数组侦听的开始。

### 依赖收集

对象的依赖收集是在 Object.defineProperty()方法的 get 方法中，那么数组呢？其实数
组也是一样。

```js
data () {
    return {
        arr: [1,2,3]
    }
}
```

在组件中，我们定义数组是这样写吧。arr 这个数据始终都存在于一个 object 数据对象中
，而且我们也说了，谁用到了数据谁就是依赖，那么要用到 arr 这个数据，是不是得先从
object 数据对象中获取一下 arr 数据，而从 object 数据对象中获取 arr 数据自然就会
触发 arr 的 get，所以我们就可以在 get 中收集依赖。这样我们做到数据可被侦听只做到
了一部分，即我们只知道了 Array 型数据何时被读取了，而何时发生变化我们无法知道，
那么接下来我们就来解决这一问题：当 Array 型数据发生变化时我们如何得知？

试想一下，要让数据发生变化，那么必然是操作了数组，而在 js 中操作数组的方法，就那
么几种。那么我们可以将数组原有的方法，在不改遍其原来的功能的基础上增加一些新的功
能是不是就很完美。这也就是 vue 的数组方法拦截器。

```js
// 源码位置：/src/core/observer/array.js

const arrayProto = Array.prototype;
// 创建一个对象作为拦截器
export const arrayMethods = Object.create(arrayProto);

// 改变数组自身内容的7个方法
const methodsToPatch = [
  'push',
  'pop',
  'shift',
  'unshift',
  'splice',
  'sort',
  'reverse',
];

/**
 * Intercept mutating methods and emit events
 */
methodsToPatch.forEach(function (method) {
  const original = arrayProto[method]; // 缓存原生方法
  Object.defineProperty(arrayMethods, method, {
    enumerable: false,
    configurable: true,
    writable: true,
    value: function mutator(...args) {
      const result = original.apply(this, args);
      return result;
    },
  });
});
```

首先创建了继承自 Array 原型的空对象 arrayMethods，接着在 arrayMethods 上使用
object.defineProperty 方法将那些可以改变数组自身的 7 个方法遍历逐个进行封装。最
后，当我们使用 push 方法的时候，其实用的是 arrayMethods.push，而
arrayMethods.push 就是封装的新函数 mutator，也就后说，实标上执行的是函数
mutator，而 mutator 函数内部执行了 original 函数，这个 original 函数就是
Array.prototype 上对应的原生方法。 那么，接下来我们就可以在 mutator 函数中做一些
其他的事，比如说发送变化通知。所以，我们需要将拦截器挂在到数组实例与
Array.prototype 之间，这样拦截器才能够生效。把数据的**proto**属性设置为拦截器
arrayMethods 即可。

```js
// 源码位置：/src/core/observer/index.js
export class Observer {
  constructor(value) {
    this.value = value;
    if (Array.isArray(value)) {
      const augment = hasProto ? protoAugment : copyAugment;
      augment(value, arrayMethods, arrayKeys);
    } else {
      this.walk(value);
    }
  }
}
// 能力检测：判断__proto__是否可用，因为有的浏览器不支持该属性
export const hasProto = '__proto__' in {};

const arrayKeys = Object.getOwnPropertyNames(arrayMethods);

/**
 * Augment an target Object or Array by intercepting
 * the prototype chain using __proto__
 */
function protoAugment(target, src: Object, keys: any) {
  target.__proto__ = src;
}

/**
 * Augment an target Object or Array by defining
 * hidden properties.
 */
/* istanbul ignore next */
function copyAugment(target: Object, src: Object, keys: Array<string>) {
  for (let i = 0, l = keys.length; i < l; i++) {
    const key = keys[i];
    def(target, key, src[key]);
  }
}
```

当数组数据再发生变化时，我们就可以在拦截器中通知变化了，也就是说现在我们就可以知
道数组数据何时发生变化了，OK，以上我们就完成了对 Array 型数据的可观测。

### 依赖收集到哪里

```js
// 源码位置：/src/core/observer/index.js
export class Observer {
  constructor(value) {
    this.value = value;
    this.dep = new Dep(); // 实例化一个依赖管理器，用来收集数组依赖
    if (Array.isArray(value)) {
      const augment = hasProto ? protoAugment : copyAugment;
      augment(value, arrayMethods, arrayKeys);
    } else {
      this.walk(value);
    }
  }
}
```

在 Observer 类中实例化了一个依赖管理器，用来收集数组依赖。

### 如何收集依赖

```js
function defineReactive(obj, key, val) {
  let childOb = observe(val);
  Object.defineProperty(obj, key, {
    enumerable: true,
    configurable: true,
    get() {
      if (childOb) {
        childOb.dep.depend();
      }
      return val;
    },
    set(newVal) {
      if (val === newVal) {
        return;
      }
      val = newVal;
      dep.notify(); // 在setter中通知依赖更新
    },
  });
}

/**
 * Attempt to create an observer instance for a value,
 * returns the new observer if successfully observed,
 * or the existing observer if the value already has one.
 * 尝试为value创建一个0bserver实例，如果创建成功，直接返回新创建的Observer实例。
 * 如果 Value 已经存在一个Observer实例，则直接返回它
 */
export function observe(value, asRootData) {
  if (!isObject(value) || value instanceof VNode) {
    return;
  }
  let ob;
  if (hasOwn(value, '__ob__') && value.__ob__ instanceof Observer) {
    ob = value.__ob__;
  } else {
    ob = new Observer(value);
  }
  return ob;
}
```

在上面代码中，我们首先通过 observe 函数为被获取的数据 arr 尝试创建一个 Observer
实例，在 observe 函数内部，先判断当前传入的数据上是否有**ob**属性，如果数据
有**ob**属性，表示它已经被转化成响应式的了，如果没有则表示该数据还不是响应式的，
那么就调用 new Observer(value)将其转化成响应式的，并把数据对应的 Observer 实例返
回。

而在 defineReactive 函数中，首先获取数据对应的 Observer 实例 childOb，然后在
getter 中调用 Observer 实例上依赖管理器，从而将依赖收集起来。

### 如何通知依赖

当依赖收集好后，我们就需要通知更新视图；

```js
/**
 * Intercept mutating methods and emit events
 */
methodsToPatch.forEach(function (method) {
  const original = arrayProto[method];
  def(arrayMethods, method, function mutator(...args) {
    const result = original.apply(this, args);
    const ob = this.__ob__;
    // notify change
    ob.dep.notify();
    return result;
  });
});
```

我们的拦截器是挂载到数组数据的原型上的，所以拦截器中的 this 就是数据 value，拿到
value 上的 Observer 类实例，从而你就可以调用 Observer 类实例上面依赖管理器的
dep.notify()方法，以达到通知依赖的目的。

### 深度侦测

数组中包含了一个对象，如果该对象的某个属性发生了变化也应该被侦测到，这就是深度侦
测。

```js
export class Observer {
  value: any;
  dep: Dep;

  constructor(value: any) {
    this.value = value;
    this.dep = new Dep();
    def(value, '__ob__', this);
    if (Array.isArray(value)) {
      const augment = hasProto ? protoAugment : copyAugment;
      augment(value, arrayMethods, arrayKeys);
      this.observeArray(value); // 将数组中的所有元素都转化为可被侦测的响应式
    } else {
      this.walk(value);
    }
  }

  /**
   * Observe a list of Array items.
   */
  observeArray(items: Array<any>) {
    for (let i = 0, l = items.length; i < l; i++) {
      observe(items[i]);
    }
  }
}

export function observe(value, asRootData) {
  if (!isObject(value) || value instanceof VNode) {
    return;
  }
  let ob;
  if (hasOwn(value, '__ob__') && value.__ob__ instanceof Observer) {
    ob = value.__ob__;
  } else {
    ob = new Observer(value);
  }
  return ob;
}
```

在上面代码中，对于 Array 型数据，调用了 observeArray()方法，该方法内部会遍历数组
中的每一个元素，然后通过调用 observe 函数将每一个元素都转化成可侦测的响应式数据
。

### 数组新增元素的侦测

对于数组中已有的元素我们已经可以将其全部转化成可侦测的响应式数据了，但是如果向数
组里新增一个元素的话，我们也需要将新增的这个元素转化成可侦测的响应式数据。这个实
现起来也很容易，我们只需拿到新增的这个元素，然后调用 observe 函数将其转化即可。
我们知道，可以向数组内新增元素的方法有 3 个，分别是：push、unshift、splice。我们
只需对这 3 中方法分别处理，拿到新增的元素，再将其转化即可。源码如下：

```js
/**
 * Intercept mutating methods and emit events
 */
methodsToPatch.forEach(function (method) {
  // cache original method
  const original = arrayProto[method];
  def(arrayMethods, method, function mutator(...args) {
    const result = original.apply(this, args);
    const ob = this.__ob__;
    let inserted;
    switch (method) {
      case 'push':
      case 'unshift':
        inserted = args; // 如果是push或unshift方法，那么传入参数就是新增的元素
        break;
      case 'splice':
        inserted = args.slice(2); // 如果是splice方法，那么传入参数列表中下标为2的就是新增的元素
        break;
    }
    if (inserted) ob.observeArray(inserted); // 调用observe函数将新增的元素转化成响应式
    // notify change
    ob.dep.notify();
    return result;
  });
});
```

在上面拦截器定义代码中，如果是 push 或 unshift 方法，那么传入参数就是新增的元素;
如果是 splice 方法，那么传入参数列表中下标为 2 的就是新增的元素，拿到新增的元素
后，就可以调用 observe 函数将新增的元素转化成响应式的了。

### 问题

当我们动态的更新数组的，某一项或者是数组的长度的时候，并不能完成侦听，当然 vue
也注意到了这一点，Vue 增加了两个全局 API:Vue.set 和 Vue.delete，这两个 API 的实
现原理将会在后面学习全局 API 的时候说到。
