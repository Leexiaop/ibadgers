---
title: 手动实现函数的防抖和节流
group: Javascript
toc: content
---

函数的防抖（debounce）和节流（throttle）都是用来控制函数在一定时间内触发的次数，
俩者都是为了减少触发频率，以便提高性能或者说避免资源浪费。

`防抖:`防抖是指触发事件后在 n 秒内只能执行一次，如果 n 秒内又触发了事件，则会重
新计算函数执行的时间。

```js
const debounce = (fn, delay) => {
  let timer = null;
  return function () {
    const self = this;
    if (timer) {
      clearTimeout(timer);
    }
    timer = setTimeout(() => {
      fn.apply(self, arguments);
      timer = null;
    }, delay);
  };
};
```

`节流:`节流就是指连续触发事件但是在 n 秒中只执行一次函数。节流会稀释函数的执行频
率。

```js
const throttle = (fn, delay) => {
  let timer;
  return function () {
    if (!timer) {
      timer = setTimeout(function () {
        fn.apply(this, arguments);
        timer = null;
      }, delay);
    }
  };
};
```

注：实际开发中，请使用 lodash;
