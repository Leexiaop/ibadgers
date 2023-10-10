---
title: 总览
---

准备了那么久，终于有想法去写写最近学习的东西了，再次也非常感谢@全栈潇晨的 react
源码分析，有幸能让自己对 react 的了解加深那么多。

react 作为当前最为流行的 js 库之一，了解 react 的源码成为前端工程师进阶的必经之
路。react 的纯粹体现在它的 api 上，一切都是围绕 setState 状态更新进行的，但是内
部的逻辑却经历了很大的重构和变化，而且代码量也不小，如果只是从源码文件和函数来阅
读，那会很难以理解 react 的渲染流程。优秀工程师几年时间打造的库，必定有借鉴之处
，那么我们应该怎样学习 react 源码呢。

### 如何学习

-   首先，我们可以从函数调用栈入手，理清 react 的各个模块的功能和它们调用的顺序
    ，盖房子一样，先搭好架子，对源码有个整体的认识，然后再看每个模块的细节，第一
    遍的时候切忌纠结每个函数实现的细节，陷入各个函数的深度调用中。
-   其次可以结合一些 demo 和自己画图理解，react 源码中设计大量的链表操作，画图是
    一个很好的理解指针操作的方式。源码里也有一些英文注释，可以根据注释或者根据此
    react 源码解析文章进行理解。

熟悉 react 源码并不是一朝一夕的事，想精进自己的技术，必须花时间才行。

### 总体结构

学习源码不能是乱学，不能是想起学什么就学什么，而应该有规划的去准备，去学习，所以
，我们的规划是这样的。

![react](https://leexiaop.github.io/static/ibadgers/code/react/react.png)

### 常见的面试题

以下这些问题可能你已经有答案了，但是你能从源码角度回答出来吗。

1. jsx 和 Fiber 有什么关系

2. react17 之前 jsx 文件为什么要声明 import React from 'react'，之后为什么不需要
   了

3. Fiber 是什么，它为什么能提高性能

<strong>hooks</strong>

4. 为什么 hooks 不能写在条件判断中

5. 状态/生命周期

6. setState 是同步的还是异步的

7. componentWillMount、componentWillMount、componentWillUpdate 为什么标记 UNSAFE
   组件

8. react 元素$$typeof 属性什么

9. react 怎么区分 Class 组件和 Function 组件

10. 函数组件和类组件的相同点和不同点

<strong>开放性问题</strong>

11. 说说你对 react 的理解/请说一下 react 的渲染过程

12. 聊聊 react 生命周期

13. 简述 diff 算法

14. react 有哪些优化手段

15. react 为什么引入 jsx

16. 说说 virtual Dom 的理解

17. 你对合成事件的理解

18. 我们写的事件是绑定在 dom 上么，如果不是绑定在哪里？

19. 为什么我们的事件手动绑定 this(不是箭头函数的情况)

20. 为什么不能用 return false 来阻止事件的默认行为？

21. react 怎么通过 dom 元素，找到与之对应的 fiber 对象的？

开启 react 源码分析之旅吧。。。
