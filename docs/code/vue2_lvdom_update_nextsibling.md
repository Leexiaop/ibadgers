---
title: 虚拟DOM篇之Update子节点
order: 6
group: vue2
toc: content
---

## 更新子节点

当新的 VNode 与旧的 oldVNode 都是元素节点并且都包含子节点时，那么这两个节点的
VNode 实例上的 children 属性就是所包含的子节点数组。我们把新的 VNode 上的子节点
数组记为 newChildren，把旧的 oldVNode 上的子节点数组记为 oldChildren，我们把
newChildren 里面的元素与 oldChildren 里的元素一一进行对比，对比两个子节点数组肯
定是要通过循环，外层循环 newChildren 数组，内层循环 oldChildren 数组，每循环外层
newChildren 数组里的一个子节点，就去内层 oldChildren 数组里找看有没有与之相同的
子节点，这个过程就是 patch 子节点的过程。伪代码如下：

```js
for (let i = 0; i < newChildren.length; i++) {
  const newChild = newChildren[i];
  for (let j = 0; j < oldChildren.length; j++) {
    const oldChild = oldChildren[j];
    if (newChild === oldChild) {
      // ...
    }
  }
}
```

所以，我们可以看出，有四种情况：

- 创建子节点

  如果发现在 newChildren 里面的某个子节点在 oldChildren 中找不到与之相同的子节
  点，那说明需要在 oldChildren 中创建这个子节点。

- 删除子节点

  如果把 newChildren 中的全部循环完，发现在 oldChildren 中还有未被处理的子节点
  ，那么说明这些子节点就需要被删除

- 移动子节点

  如果在 oldChildren 中找到了 newChildren 中的某个子节点，但是发现位置不同，那
  么就要以 newChildren 中子节点为基准，将 oldChildren 中的子节点移动到相应的位
  置。

- 更新子节点

  如果 newChildren 里面的某个子节点在 oldChildren 里找到了与之相同的子节点，并
  且所处的位置也相同，那么就更新 oldChildren 里该节点，使之与 newChildren 里的
  该节点相同。

接下来，我们分别看下这四种情况如何处理？

### 创建子节点

创建节点我们不在讲述，重要的是，如何将创建的子节点，插入到对对应的位置。这个对应
的位置就是`所有未处理节点之前，而并非所有已处理节点之后`.

- case1:
  ![case1](https://leexiaop.github.io/static/ibadgers/code/vue2/update_son_vnode_1.png)
  上图中表示，左边是新的 VNode,右边是 oldVNode,当我们循环遍历的时候，发现前俩
  个可以按照我们想象中的那样处理完成，但是当循环 newChildren 中第三个子节点的
  时候发现，在 oldChildren 中并没有找到，那么就需要创建子节点。然后在
  oldChildren 中插入到真实的 DOM 里的第三个位置也就处理完成，这也是我们想要的
  结果。
- case2:
  ![case1](https://leexiaop.github.io/static/ibadgers/code/vue2/update_son_vnode_2.png)
  在 case1 中，我们完成好了第三个创建的子节点并放在了正确的位置。那么我们来看
  第四个需要创建的子节点的位置在那里？我们会发现他被插入到了 oldChildren 数组
  中第三个前面，这就出现了错误，所以，我们不能把创建的子节点放到 oldChildren
  中已经处理的节点后面，而应该是放到未处理的子节点前面。

### 删除子节点

将 newChildren 全部遍历后，发现在 oldChildren 中还有未被处理的子节点，那么就要把
oldChildren 中未被处理的子节点都删除，这和删除节点是一样的道理。

### 移动子节点

遍历了 newChildren 和 oldChildren 后发现，找到了相同的子节点，但是他们的位置不一
样。那么就需要以 newChildren 中位置为基准，移动在 oldChildren 中子节点的位置。
![case1](https://leexiaop.github.io/static/ibadgers/code/vue2/update_son_vnode_3.png)
在上图中，绿色的两个节点是相同节点但是所处位置不同，即 newChildren 里面的第三个
子节点与真实 DOM 即 oldChildren 里面的第四个子节点相同但是所处位置不同，按照上面
所说的，我们应该以 newChildren 里子节点的位置为基准，调整 oldChildren 里该节点的
位置，所以我们应该把真实 DOM 即 oldChildren 里面的第四个节点移动到第三个节点的位
置，通过上图中的标注我们不难发现，`所有未处理节点之前就是我们要移动的目的位置`。

### 更新子节点

如果 newChildren 里面的某个子节点在 oldChildren 里找到了与之相同的子节点，并且所
处的位置也相同，那么就更新 oldChildren 里该节点，使之与 newChildren 里的该节点相
同。

## 回归源码

```js
// 源码位置： /src/core/vdom/patch.js

if (isUndef(idxInOld)) {
  // 如果在oldChildren里找不到当前循环的newChildren里的子节点
  // 新增节点并插入到合适位置
  createElm(
    newStartVnode,
    insertedVnodeQueue,
    parentElm,
    oldStartVnode.elm,
    false,
    newCh,
    newStartIdx,
  );
} else {
  // 如果在oldChildren里找到了当前循环的newChildren里的子节点
  vnodeToMove = oldCh[idxInOld];
  // 如果两个节点相同
  if (sameVnode(vnodeToMove, newStartVnode)) {
    // 调用patchVnode更新节点
    patchVnode(vnodeToMove, newStartVnode, insertedVnodeQueue);
    oldCh[idxInOld] = undefined;
    // canmove表示是否需要移动节点，如果为true表示需要移动，则移动节点，如果为false则不用移动
    canMove &&
      nodeOps.insertBefore(parentElm, vnodeToMove.elm, oldStartVnode.elm);
  }
}
```

以上代码中，首先判断在 oldChildren 里能否找到当前循环的 newChildren 里的子节点，
如果找不到，那就是新增节点并插入到合适位置；如果找到了，先对比两个节点是否相同，
若相同则先调用 patchVnode 更新节点，更新完之后再看是否需要移动节点.
