---
title: 实现拷贝函数
group: Javascript
toc: content
---

数据类型的拷贝分为主要是针对引用类型的数据而言的，有深拷贝和浅拷贝之分，都是将数
据复制一份，表象来看，就是修改拷贝后的数据，原数据会不会跟着改变。而对于基本类型
的数据而言，拷贝既是赋值运算。

### 浅拷贝的方法

- 赋值运算
- Object.assign()
- ...

### 深拷贝

- JSON.stringfy()
  - ① 如果 obj 里有函数，undefined，则序列化的结果会把函数或 undefined 丢失
    ；
  - ② 如果 obj 里有 NaN、Infinity 和-Infinity，则序列化的结果会变成 null；
  - ③JSON.stringify()只能序列化对象的可枚举的自有属性，例如 如果 obj 中的对
    象是有构造函数生成的， 则使用 JSON.parse(JSON.stringify(obj))深拷贝后，
    会丢弃对象的 constructor；
  - ④ 如果对象中存在循环引用的情况也无法正确实现深拷贝；
  - ⑤ 如果 obj 里有 RegExp(正则表达式的缩写)、Error 对象，则序列化的结果将只
    得到空对象；
  - ⑥ 如果 obj 里面有时间对象，则 JSON.stringify 后再 JSON.parse 的结果，时
    间将只是字符串的形式，而不是对象的形式；
- 比较简单的深拷贝方法

```js
const deepClone = (obj) => {
  if (!obj || typeof obj !== 'object') return obj;
  let result = Array.isArray(obj) ? [] : {};
  for (let key in obj) {
    if (obj.hasOwnProperty(key)) {
      result[key] = deepClone(obj[key]);
    }
  }
  return result;
};
```

- 深拷贝循环引用的问题循环引用问题的产生原因可能是对象之间相互引用，也可能是对
  象引用了其自身，而造成死循环的原因则是我们在进行深拷贝时并没有将这种引用情况
  考虑进去，因此解决问题的关键也就是可以将这些引用存储起来并在发现引用时返回被
  引用过的对象，从而结束递归的调用。

```js

const deepClone = (originObj, map = new WeakMap()) => {
    if(!originObj || typeof originObj !== 'object') return originObj;  //空或者非对象则返回本身

    //如果这个对象已经被记录则直接返回
    if(map.get(originObj)) {
        return  map.get(originObj);
    }
    //这个对象还没有被记录，将其引用记录在map中，进行拷贝
    let result = Array.isArray(originObj) ? [] : {};  //拷贝结果
    map.set(originObj, result); //记录引用关系
    let keys = Object.keys(originObj); //originObj的全部key集合
    //拷贝
    for(let i = 0,len = keys.length; i < len; i++) {
        let key = keys[i];
        let temp = originObj[key];
        result[key] = deepClone(temp, map);
    }
    return result;
```
