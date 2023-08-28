---
title: 实现数组去重函数
group: Javascript
toc: content
---

### new Set 方法去重

```js
const unduplicate = (arr) => {
  return Array.from(new Set(arr));
};
```

- new Set()返回了一个类数组，需要通过 Array.from 来格式化成真正的数据
  。Array.from 的用法
  ：[https://developer.mozilla.org/zh-CN/docs/Web/JavaScript/Reference/Global_Objects/Array/from]

### indexof 方法去重

```js
const unduplicate = (arr) => {
  let list = [];
  arr.forEach((item) => {
    if (list.indexOf(item) === -1) {
      list.push(item);
    }
  });
  return list;
};
```

类似的方法还很多，总的思路就是循环原数组，然后另外一个空集中查找有没有当前的元素
，如果没有，就放到空集中，那么这个空集就是去重后你想要的。
