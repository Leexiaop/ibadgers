---
title: React的Fiber是什么
group: react
toc: content
---

## React 的 Fiber 出现之前 React 存在的问题

由于 Javascript 引擎和页面渲染引擎是俩个互拆的线程，当其中一个线程执行时，另外一
个线程只能挂起等待。如果 JavaScript 线程长时间的占用主线程，那么页面渲染引擎更新
页面就不得不长长时间的等待。界面长时间不更新，会导致页面响应度变差，用户可能会感
觉到卡顿。这就是 react 16.8 版本之前面临的问题。而当 react 在渲染组件时候，从开
始渲染到完成是一气呵成的，无法中断，如果组件较大，那么 js 线程就会一直执行，然后
等整颗 VDOM 树都计算完成才会交给渲染线程，这就会导致一些用户交互，动画等任务无法
立即处理，导致卡顿。

## React 的 Fiber 是什么

React Fiber 是 React 开发团队对 React 核心算法的一次重新实现。主要做了以下操作：

- 为每一个任务增加了优先级之分，优先级高的任务可以中断优先级低的任务，然后重新
  执行优先级低的任务
- 增加了异步任务，调用 requestIdleCallback Api,浏览器空闲的时候执行
- dom diff 树变成了链表，一个 dom 对应俩个 fiber，对应俩个队列，这都是为了找到
  被中断的任务，重新执行从架构来说，fiber 是对 react 核心算法的重写从编码角度
  来说，react 内部定义的一种数据结构，他是 fiber 树结构的节点单位，也就是
  react16 新架构下的虚拟 DOM，一个 fiber 就是一个 JavaScript 对象，包含了元素
  的信息、该元素的更新操作队列、类型，其数据结构如下：

```js
type Fiber = {
  // 用于标记fiber的WorkTag类型，主要表示当前fiber代表的组件类型如FunctionComponent、ClassComponent等
  tag: WorkTag,
  // ReactElement里面的key
  key: null | string,
  // ReactElement.type，调用`createElement`的第一个参数
  elementType: any,
  // The resolved function/class/ associated with this fiber.
  // 表示当前代表的节点类型
  type: any,
  // 表示当前FiberNode对应的element组件实例
  stateNode: any,

  // 指向他在Fiber节点树中的`parent`，用来在处理完这个节点之后向上返回
  return: Fiber | null,
  // 指向自己的第一个子节点
  child: Fiber | null,
  // 指向自己的兄弟结构，兄弟节点的return指向同一个父节点
  sibling: Fiber | null,
  index: number,

  ref: null | (((handle: mixed) => void) & { _stringRef: ?string }) | RefObject,

  // 当前处理过程中的组件props对象
  pendingProps: any,
  // 上一次渲染完成之后的props
  memoizedProps: any,

  // 该Fiber对应的组件产生的Update会存放在这个队列里面
  updateQueue: UpdateQueue<any> | null,

  // 上一次渲染的时候的state
  memoizedState: any,

  // 一个列表，存放这个Fiber依赖的context
  firstContextDependency: ContextDependency<mixed> | null,

  mode: TypeOfMode,

  // Effect
  // 用来记录Side Effect
  effectTag: SideEffectTag,

  // 单链表用来快速查找下一个side effect
  nextEffect: Fiber | null,

  // 子树中第一个side effect
  firstEffect: Fiber | null,
  // 子树中最后一个side effect
  lastEffect: Fiber | null,

  // 代表任务在未来的哪个时间点应该被完成，之后版本改名为 lanes
  expirationTime: ExpirationTime,

  // 快速确定子树中是否有不在等待的变化
  childExpirationTime: ExpirationTime,

  // fiber的版本池，即记录fiber更新过程，便于恢复
  alternate: Fiber | null,
};
```

## Fiber 如何解决问题

Fiber 把渲染更新过程拆分成多个子任务，每次只做一小部分，做完看是否还有剩余时间，
如果有继续下一个任务；如果没有，挂起当前任务，将时间控制权交给主线程，等主线程不
忙的时候在继续执行.即可以中断与恢复，恢复后也可以复用之前的中间状态，并给不同的
任务赋予不同的优先级，其中每个任务更新单元为 React Element 对应的 Fiber 节点。实
现的上述方式的是 requestIdleCallback 方法，window.requestIdleCallback()方法将在
浏览器的空闲时段内调用的函数排队。这使开发者能够在主事件循环上执行后台和低优先级
工作，而不会影响延迟关键事件，如动画和输入响应。

首先 React 中任务切割为多个步骤，分批完成。在完成一部分任务之后，将控制权交回给
浏览器，让浏览器有时间再进行页面的渲染。等浏览器忙完之后有剩余时间，再继续之前
React 未完成的任务，是一种合作式调度。

该实现过程是基于 Fiber 节点实现，作为静态的数据结构来说，每个 Fiber 节点对应一个
React element，保存了该组件的类型（函数组件/类组件/原生组件等等）、对应的 DOM 节
点等信息。

作为动态的工作单元来说，每个 Fiber 节点保存了本次更新中该组件改变的状态、要执行
的工作。

每个 Fiber 节点有个对应的 React element，多个 Fiber 节点根据如下三个属性构建一颗
树：

```js
// 指向父级Fiber节点
this.return = null;
// 指向子Fiber节点
this.child = null;
// 指向右边第一个兄弟Fiber节点
this.sibling = null;
```

通过这些属性就能找到下一个执行目标.
