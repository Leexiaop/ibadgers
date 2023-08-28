---
title: 微信小程序组件通信之EventBus
group: 小程序
toc: content
---

小程序中组件的通信方式会有很多种，但是从 B 页面会退到 A 页面需要刷新 A 页面，这
就是个不太好办的事儿。所以，我们就通过 EventBus 来解决这个问题。

## EventBus 有什么功能

- 能满足页面之间的通讯
- 能满足页面和组件(component)之间的通讯
- 能满足组件(component)之间的通讯
- 为了能正确响应到自己想要的事件，需要通过一个 key 来标识每一个事件
- 而且不同的页面可以使用相同的 key 来作为事件标识
- 最后还要使用姿势要简单

## 实现原理

我们用全局的字典来存储系统中所有的订阅消息，其中 key 是事件标识，每个 key 对应一
个数组（这里用数组二不用单个对象是为了能在不同的页面能用相同的 key 订阅事件，因
为有时候一个页面发布消息需要响应多个页面），数组中每个元素是一个对象。其中
target 表示订阅消息的发起者，callback 表示对应发起者的回调函数，然后发布消息的时
候直接通过对应的 key 来拿到消息队列，然后遍历队列发布消息。

## 实现

我们需要在全局的字典，其次对外暴露三个 API，分别是：

- 消息订阅
- 消息发布
- 取消订阅

```js
//  eventBus.js
let events = new Map();
/**
 * 消息订阅
 * key：消息标识
 * target：消息发起者，用来区分相同key不同的消息
 * callback：回调函数
 */
const sub = (key, target, callback) => {};
/**
 * 消息发布
 * key：消息标识
 * data：回调数据
 */
const pub = (key, data) => {};
/**
 * 取消订阅
 * key：消息标识
 * target：消息发起者，用来区分相同key不同的消息
 */
const cancel = (key, target) => {};

module.exports = {
  sub: sub,
  pub: pub,
  cancel: cancel,
};
```

### 订阅消息

订阅消息的时候每个 key 对应一个消息队列，如果消息队列中有存在 target 相同的消息
，则直接覆盖原来的订阅内容，没有的话则将消息插入队列。

```js
/**
 * 消息订阅
 * key：消息标识
 * target：消息发起者，用来区分相同key不同的消息
 * callback：回调函数
 */
const sub = (key, target, callback) => {
  //消息对象
  let eobj = { target: target, callback: callback };
  //先通过key拿到对应的消息队列
  let value = events.get(key);
  //当前key已存在消息队列说明是不同页面相同的key的消息订阅
  if (Array.isArray(value)) {
    //过滤出消息发起者不同的消息，相当于覆盖key和target都一样的消息
    value = value.filter(function (e) {
      return e.target != target;
    });
    //过滤出的队列重新插入此次订阅的消息
    value.push(eobj);
    events.set(key, value);
  } else {
    //不是队列表示字典中没有包含当前key的消息，直接插入
    events.set(key, [eobj]);
  }
  console.log('function sub ', events);
};
```

### 发布实现

通过 key 来拿到字典（Map）中的消息队列，然后遍历队列逐一进行函数回调即可。

```js
/**
 * 消息发布
 * key：消息标识
 * data：回调数据
 */
const pub = (key, data) => {
  //通过key拿到消息队列
  var value = events.get(key);
  //如果队列存在则遍历队列，然后调用消息发起者的回调函数，并将data数据进行回调
  if (Array.isArray(value)) {
    value.map(function (e) {
      var target = e.target;
      var callback = e.callback;
      callback.call(target, data);
    });
  }
};
```

### 取消订阅

因为字典中存储的消息队列中包含 target 对象，这个对象包含的数据较大，如果再订阅消
息的页面卸载（回调 onupload 函数）的时候不取消订阅，容易造成内存溢出。

```js
/**
 * 取消订阅
 * key：消息标识
 * target：消息发起者，用来区分相同key不同的消息
 */
const cancel = (key, target) => {
  let haskey = events.has(key);
  //是否存在此消息队列
  if (haskey) {
    let value = events.get(key);
    if (Array.isArray(value)) {
      //如果队列中只有一条数据直接删除
      if (value.length == 1) {
        events.delete(key);
      } else {
        //如果队列中存在多条数据则过滤出和当前取消订阅target不同的消息然后重新设置到key的消息队列中
        value = value.filter(function (e) {
          return e.target != target;
        });
        events.set(key, value);
      }
    }
  }
  console.log('function cancel ', events);
};
```

## 使用

- 引入 eventBus.js 文件
- 在 A 页面中订阅 eventBus.sub('home', this, function(content) {

})

- 在 B 页面中发布 eventBus.pub('home', data)
- 在 onUnLoad 中取消订阅 eventBus.cancel('home', this)
