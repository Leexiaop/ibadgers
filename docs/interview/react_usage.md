---
title: React Hooks为什么不能在循环、条件和嵌套函数中调用？
group: react
toc: content
---

React 官网介绍了一个 Hooks 的限制：不要在循环，条件或者嵌套函数中调用 hooks,确保
总是在你的 React 函数的最顶层以及任何 return 之前调用他们。那么这是为什么呢？我
们以 useState 为例：

```js
const [name, setName] = useState('北京');
const [address, setAddress] = useState('深圳');
```

每一个 useState 都会在当前组件中创建一个 hook 对象，并且这个对象中的 next 属性始
终执行下一个 useState 的 hook 对象。这些对象以一种类似链表的形式存在
Fiber.memoizedState 中。而函数组件就是通过 fiber 这个数据结构来实现每次 render
后 name address 不会被 useState 重新初始化。

正是因为 hooks 中是这样存储 state 的 所以我们只能在 hooks 的根作用域中使用
useState，而不能在条件语句和循环中使用。因为我们不能每次都保证条件或循环语句都会
执行。
