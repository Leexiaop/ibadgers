---
title: 数据侦听篇之对象
order: 2
group: vue2
toc: content
---

数据驱动试图的关键点是在于我们要知道`数据什么时候发生了变化`。我们知道了这么问题
就因人而解。对于 Object 来说，Javascript 为我们提供了
API:`Object.defineProperty()`来解决这个问题。

## Object.defineProperty 使得对象可被侦听

我们先来看看 Object.defineProperty 小案例。

```js
const car = {
  name: 'bmw',
  price: 4000,
};
Object.defineProperty(car, 'price', {
  enumerable: true,
  configurable: true,
  get() {
    console.log('price属性被读取了');
    return val;
  },
  set(newVal) {
    console.log('price属性被修改了');
    val = newVal;
  },
});
```

我们可以看到，在 Object.defineProperty()方法的 get 中可以侦听到 price 属性被读取
了，在 set 中可以侦听到 price 修改了。这就是最基本的侦听过程。那么我们来看 vue
是怎么做的，上源码。

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
/**
 * 使一个对象转化成可观测对象
 * @param { Object } obj 对象
 * @param { String } key 对象的key
 * @param { Any } val 对象的某个key的值
 */
function defineReactive(obj, key, val) {
  // 如果只传了obj和key，那么val = obj[key]
  if (arguments.length === 2) {
    val = obj[key];
  }
  if (typeof val === 'object') {
    new Observer(val);
  }
  Object.defineProperty(obj, key, {
    enumerable: true,
    configurable: true,
    get() {
      console.log(`${key}属性被读取了`);
      return val;
    },
    set(newVal) {
      if (val === newVal) {
        return;
      }
      console.log(`${key}属性被修改了`);
      val = newVal;
    },
  });
}
```

我们来解析一下这段代码：vue 中实现了一个 Observer 的类，他的最重要的作用是将一个
普通对象转变为可侦听的对象。所以 Observer 类在初始化的 constructor 中给 value 通
过 def 函数给 value 添加了一个**ob**的属性，用来标记对象已经是一个可被侦听的对象
，避免重复处理。

紧接着，判断了该 value 是不是数组，如果是数组当作数组处理，否则就按照对象处理，
调用了 walk 函数，可以看到 walk 函数获取了整个对象的 key,然后遍历 key 循环调用了
defineReactive，而 defineReactive 方法的主要作用就是实现对象属性的侦听。当判断某
个属性的 value 是对象，那么久再次通过 new Observer()的方式递归上面的操作，最终做
到将对象的所有属性都得到侦听。那么在 Object.defineProperty()方法的 get/set 方法
中，就可以做我们想做的事儿：`依赖收集`和`通知view更新`；

## 依赖收集

### 什么是依赖收集

简单来说，就是 view 中`谁用到了这个被侦听的对象,谁就是那个依赖`，因为在 view 中
可能不只有一个地方用到了对象的某个属性。那么当数据更新的时候，我们要告诉那些用到
被更新数据的地方，说数据更新了，你们的 view 也需要更新了。这个过程就
是`依赖收集`。具体在 vue 中，这个`谁`到底是什么，其实在 vue 中实现了一个 watcher
的类用来，vue 为每一个用到数据的`谁`创建一个 watcher 实例，在创建 Watcher 实例的
过程中会自动的把自己添加到这个数据对应的依赖管理器中。当数据发生变化的时候，只需
要通知对应的 watcher,然后由 watcher 来通知 view 更新试图。

```js
export default class Watcher {
  constructor(vm, expOrFn, cb) {
    this.vm = vm;
    this.cb = cb;
    this.getter = parsePath(expOrFn);
    this.value = this.get();
  }
  get() {
    window.target = this;
    const vm = this.vm;
    let value = this.getter.call(vm, vm);
    window.target = undefined;
    return value;
  }
  update() {
    const oldValue = this.value;
    this.value = this.get();
    this.cb.call(this.vm, this.value, oldValue);
  }
}

/**
 * Parse simple path.
 * 把一个形如'data.a.b.c'的字符串路径所表示的值，从真实的data对象中取出来
 * 例如：
 * data = {a:{b:{c:2}}}
 * parsePath('a.b.c')(data)  // 2
 */
const bailRE = /[^\w.$]/;
export function parsePath(path) {
  if (bailRE.test(path)) {
    return;
  }
  const segments = path.split('.');
  return function (obj) {
    for (let i = 0; i < segments.length; i++) {
      if (!obj) return;
      obj = obj[segments[i]];
    }
    return obj;
  };
}
```

`创建Watcher实例的过程中它是如何的把自己添加到这个数据对应的依赖管理器中`这是
watcher 的关键作用。从源码中可以看到：首先通过 window.target = this 把实例自身赋
给了全局的一个唯一对象 window.target 上，然后通过 let value =
this.getter.call(vm, vm)获取一下被依赖的数据，获取被依赖数据的目
的`是触发该数据上面的get方法(Object.defineProperty()的get方法)`。而当数据变化时
，会触发数据的 set 方法(Object.defineProperty()的 set 方法)，所以，这样以来，就
把收集依赖和通知更新视图的任务都汇聚到了 get/set 方法中。所以当 watcher 实例的数
据变化触发 get 方法的时候，就是依赖收集的时候，set 方法被触发的时候，就是通知
view 更新的时候。

### 如何收集依赖和更新视图

那么如何收集依赖呢，vue 实现了 Dep 的类，作为依赖管理器。

```js
// 源码位置：src/core/observer/dep.js
export default class Dep {
  constructor() {
    this.subs = [];
  }

  addSub(sub) {
    this.subs.push(sub);
  }
  // 删除一个依赖
  removeSub(sub) {
    remove(this.subs, sub);
  }
  // 添加一个依赖
  depend() {
    if (window.target) {
      this.addSub(window.target);
    }
  }
  // 通知所有依赖更新
  notify() {
    const subs = this.subs.slice();
    for (let i = 0, l = subs.length; i < l; i++) {
      subs[i].update();
    }
  }
}

/**
 * Remove an item from an array
 */
export function remove(arr, item) {
  if (arr.length) {
    const index = arr.indexOf(item);
    if (index > -1) {
      return arr.splice(index, 1);
    }
  }
}
```

从源码中，可以看到，首先创建了一个 subs 的数组，这里就是存放所有的依赖项，也就是
watcher 实例。而其他都是对 subs 的增、删、改和通知依赖更新的 notify 方法。有了依
赖管理器，就可以在 get/set 方法中收集依赖/通知更新视图。

```js
function defineReactive(obj, key, val) {
  if (arguments.length === 2) {
    val = obj[key];
  }
  if (typeof val === 'object') {
    new Observer(val);
  }
  const dep = new Dep(); //实例化一个依赖管理器，生成一个依赖管理数组dep
  Object.defineProperty(obj, key, {
    enumerable: true,
    configurable: true,
    get() {
      dep.depend(); // 在getter中收集依赖
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
```

这就是 vue 对非数组数据的侦听。整体流程：

- Data 通过 observer 转换成了 get/set 的形式来追踪变化。
- 当外界通过 Watcher 读取数据时，会触发 get 从而将 Watcher 添加到依赖中。
- 当数据发生了变化时，会触发 set，从而向 Dep 中的依赖（即 Watcher）发送通知。
- Watcher 接收到通知后，会向外界发送通知，变化通知到外界后可能会触发视图更新，
  也有可能触发用户的某个回调函数等。

## 问题

虽然我们通过 Object.defineProperty 方法实现了对 object 数据的可观测，但是这个方
法仅仅只能观测到 object 数据的取值及设置值，当我们向 object 数据里添加一对新的
key/value 或删除一对已有的 key/value 时，它是无法观测到的，导致当我们对 object
数据添加或删除值时，无法通知依赖，无法驱动视图进行响应式更新。

当然，Vue 也注意到了这一点，为了解决这一问题，Vue 增加了两个全局 API:Vue.set 和
Vue.delete，这两个 API 的实现原理将会在后面学习全局 API 的时候说到。
