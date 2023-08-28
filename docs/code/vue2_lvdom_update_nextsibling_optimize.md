---
title: 虚拟DOM篇之Update子节点优化
order: 7
group: vue2
toc: content
---

## 为什么需要优化？

```js
const newChildren = [
  '新子节点1',
  '新子节点2',
  '新子节点3',
  '新子节点4',
  '新子节点5',
];
const oldChildren = [
  '旧子节点1',
  '旧子节点2',
  '旧子节点3',
  '旧子节点4',
  '旧子节点5',
];
```

我们通过上面的俩个数组来模拟数据更新前后的子节点，根据上一篇我们所讲，先外层循环
newChildren 数组，再内层循环 oldChildren 数组，每循环外层 newChildren 数组里的一
个子节点，就去内层 oldChildren 数组里找看有没有与之相同的子节点，最后根据不同的
情况作出不同的操作。那么按照上面 newChildren 和 oldChildren 就要循环 5\*5=25 次
，但是，这 25 次，也许只需要做一次操作，那么当子节点数据越来越长的时候，复杂度就
会更高，所以，我们需要做出一些优化。

## 优化思路

我们不要按顺序去循环 newChildren 和 oldChildren 这两个数组，可以先比较这两个数组
里特殊位置的子节点：

- 先把 newChildren 数组里的所有未处理子节点的第一个子节点和 oldChildren 数组里
  所有未处理子节点的第一个子节点做比对，如果相同，那就直接进入更新节点的操作；
- 如果不同，再把 newChildren 数组里所有未处理子节点的最后一个子节点和
  oldChildren 数组里所有未处理子节点的最后一个子节点做比对，如果相同，那就直接
  进入更新节点的操作；
- 如果不同，再把 newChildren 数组里所有未处理子节点的最后一个子节点和
  oldChildren 数组里所有未处理子节点的第一个子节点做比对，如果相同，那就直接进
  入更新节点的操作，更新完后再将 oldChildren 数组里的该节点移动到与
  newChildren 数组里节点相同的位置；
- 如果不同，再把 newChildren 数组里所有未处理子节点的第一个子节点和
  oldChildren 数组里所有未处理子节点的最后一个子节点做比对，如果相同，那就直接
  进入更新节点的操作，更新完后再将 oldChildren 数组里的该节点移动到与
  newChildren 数组里节点相同的位置；
- 最后四种情况都试完如果还不同，那就按照之前循环的方式来查找节点。

`注:`

- newChildren 数组里的所有未处理子节点的第一个子节点称为：新前；
- newChildren 数组里的所有未处理子节点的最后一个子节点称为：新后；
- oldChildren 数组里的所有未处理子节点的第一个子节点称为：旧前；
- oldChildren 数组里的所有未处理子节点的最后一个子节点称为：旧后；

### 新前与旧前

把 newChildren 数组里的所有未处理子节点的第一个子节点和 oldChildren 数组里所有未
处理子节点的第一个子节点做比对，如果相同，那好极了，直接进入之前文章中说的更新节
点的操作并且由于新前与旧前两个节点的位置也相同，无需进行节点移动操作；如果不同，
没关系，再尝试后面三种情况。

### 新后与旧后

把 newChildren 数组里所有未处理子节点的最后一个子节点和 oldChildren 数组里所有未
处理子节点的最后一个子节点做比对，如果相同，那就直接进入更新节点的操作并且由于新
后与旧后两个节点的位置也相同，无需进行节点移动操作；如果不同，继续往后尝试。

### 新后与旧前

把 newChildren 数组里所有未处理子节点的最后一个子节点和 oldChildren 数组里所有未
处理子节点的第一个子节点做比对，如果相同，那就直接进入更新节点的操作，更新完后再
将 oldChildren 数组里的该节点移动到与 newChildren 数组里节点相同的位置；此时，出
现了移动节点的操作，移动节点最关键的地方在于找准要移动的位置。我们一再强调，更新
节点要以新 VNode 为基准，然后操作旧的 oldVNode，使之最后旧的 oldVNode 与新的
VNode 相同。那么现在的情况是：newChildren 数组里的最后一个子节点与 oldChildren
数组里的第一个子节点相同，那么我们就应该在 oldChildren 数组里把第一个子节点移动
到最后一个子节点的位置.我们要把 oldChildren 数组里把第一个子节点移动到数组中所有
未处理节点之后.

### 新前与旧后

把 newChildren 数组里所有未处理子节点的第一个子节点和 oldChildren 数组里所有未处
理子节点的最后一个子节点做比对，如果相同，那就直接进入更新节点的操作，更新完后再
将 oldChildren 数组里的该节点移动到与 newChildren 数组里节点相同的位置；同样，这
种情况的节点移动位置逻辑与“新后与旧前”的逻辑类似，那就是 newChildren 数组里的第
一个子节点与 oldChildren 数组里的最后一个子节点相同，那么我们就应该在
oldChildren 数组里把最后一个子节点移动到第一个子节点的位置.我们要把 oldChildren
数组里把最后一个子节点移动到数组中所有未处理节点之前。

`如果以上4种情况逐个试遍之后要是还没找到相同的节点，那就再通过之前的循环方式查找。`

## 回归源码

```js
// 循环更新子节点
function updateChildren(
  parentElm,
  oldCh,
  newCh,
  insertedVnodeQueue,
  removeOnly,
) {
  let oldStartIdx = 0; // oldChildren开始索引
  let oldEndIdx = oldCh.length - 1; // oldChildren结束索引
  let oldStartVnode = oldCh[0]; // oldChildren中所有未处理节点中的第一个
  let oldEndVnode = oldCh[oldEndIdx]; // oldChildren中所有未处理节点中的最后一个

  let newStartIdx = 0; // newChildren开始索引
  let newEndIdx = newCh.length - 1; // newChildren结束索引
  let newStartVnode = newCh[0]; // newChildren中所有未处理节点中的第一个
  let newEndVnode = newCh[newEndIdx]; // newChildren中所有未处理节点中的最后一个

  let oldKeyToIdx, idxInOld, vnodeToMove, refElm;

  // removeOnly is a special flag used only by <transition-group>
  // to ensure removed elements stay in correct relative positions
  // during leaving transitions
  const canMove = !removeOnly;

  if (process.env.NODE_ENV !== 'production') {
    checkDuplicateKeys(newCh);
  }

  // 以"新前"、"新后"、"旧前"、"旧后"的方式开始比对节点
  while (oldStartIdx <= oldEndIdx && newStartIdx <= newEndIdx) {
    if (isUndef(oldStartVnode)) {
      oldStartVnode = oldCh[++oldStartIdx]; // 如果oldStartVnode不存在，则直接跳过，比对下一个
    } else if (isUndef(oldEndVnode)) {
      oldEndVnode = oldCh[--oldEndIdx];
    } else if (sameVnode(oldStartVnode, newStartVnode)) {
      // 如果新前与旧前节点相同，就把两个节点进行patch更新
      patchVnode(oldStartVnode, newStartVnode, insertedVnodeQueue);
      oldStartVnode = oldCh[++oldStartIdx];
      newStartVnode = newCh[++newStartIdx];
    } else if (sameVnode(oldEndVnode, newEndVnode)) {
      // 如果新后与旧后节点相同，就把两个节点进行patch更新
      patchVnode(oldEndVnode, newEndVnode, insertedVnodeQueue);
      oldEndVnode = oldCh[--oldEndIdx];
      newEndVnode = newCh[--newEndIdx];
    } else if (sameVnode(oldStartVnode, newEndVnode)) {
      // Vnode moved right
      // 如果新后与旧前节点相同，先把两个节点进行patch更新，然后把旧前节点移动到oldChilren中所有未处理节点之后
      patchVnode(oldStartVnode, newEndVnode, insertedVnodeQueue);
      canMove &&
        nodeOps.insertBefore(
          parentElm,
          oldStartVnode.elm,
          nodeOps.nextSibling(oldEndVnode.elm),
        );
      oldStartVnode = oldCh[++oldStartIdx];
      newEndVnode = newCh[--newEndIdx];
    } else if (sameVnode(oldEndVnode, newStartVnode)) {
      // Vnode moved left
      // 如果新前与旧后节点相同，先把两个节点进行patch更新，然后把旧后节点移动到oldChilren中所有未处理节点之前
      patchVnode(oldEndVnode, newStartVnode, insertedVnodeQueue);
      canMove &&
        nodeOps.insertBefore(parentElm, oldEndVnode.elm, oldStartVnode.elm);
      oldEndVnode = oldCh[--oldEndIdx];
      newStartVnode = newCh[++newStartIdx];
    } else {
      // 如果不属于以上四种情况，就进行常规的循环比对patch
      if (isUndef(oldKeyToIdx))
        oldKeyToIdx = createKeyToOldIdx(oldCh, oldStartIdx, oldEndIdx);
      idxInOld = isDef(newStartVnode.key)
        ? oldKeyToIdx[newStartVnode.key]
        : findIdxInOld(newStartVnode, oldCh, oldStartIdx, oldEndIdx);
      // 如果在oldChildren里找不到当前循环的newChildren里的子节点
      if (isUndef(idxInOld)) {
        // New element
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
        } else {
          // same key but different element. treat as new element
          createElm(
            newStartVnode,
            insertedVnodeQueue,
            parentElm,
            oldStartVnode.elm,
            false,
            newCh,
            newStartIdx,
          );
        }
      }
      newStartVnode = newCh[++newStartIdx];
    }
  }
  if (oldStartIdx > oldEndIdx) {
    /**
     * 如果oldChildren比newChildren先循环完毕，
     * 那么newChildren里面剩余的节点都是需要新增的节点，
     * 把[newStartIdx, newEndIdx]之间的所有节点都插入到DOM中
     */
    refElm = isUndef(newCh[newEndIdx + 1]) ? null : newCh[newEndIdx + 1].elm;
    addVnodes(
      parentElm,
      refElm,
      newCh,
      newStartIdx,
      newEndIdx,
      insertedVnodeQueue,
    );
  } else if (newStartIdx > newEndIdx) {
    /**
     * 如果newChildren比oldChildren先循环完毕，
     * 那么oldChildren里面剩余的节点都是需要删除的节点，
     * 把[oldStartIdx, oldEndIdx]之间的所有节点都删除
     */
    removeVnodes(parentElm, oldCh, oldStartIdx, oldEndIdx);
  }
}
```

其实，节点有可能是从前面对比，也有可能是从后面对比，对比成功就会进行更新处理，也
就是说我们有可能处理第一个，也有可能处理最后一个，那么我们在循环的时候就不能简单
从前往后或从后往前循环，而是要从两边向中间循环。那么我们先声明 4 个指针：

- newStartIdx:newChildren 数组里开始位置的下标；
- newEndIdx:newChildren 数组里结束位置的下标；
- oldStartIdx:oldChildren 数组里开始位置的下标；
- oldEndIdx:oldChildren 数组里结束位置的下标；在循环的时候，每处理一个节点，就
  将下标向中间移动一个位置，开始位置所表示的节点被处理后，就向后移动一个位置；
  结束位置所表示的节点被处理后，就向前移动一个位置；由于我们的优化策略都是新旧
  节点两两更新的，所以一次更新将会移动两个节点。说的再直白一点就是
  ：newStartIdx 和 oldStartIdx 只能往后移动（只会加），newEndIdx 和 oldEndIdx
  只能往前移动（只会减）。当开始位置大于结束位置时，表示所有节点都已经遍历过了
  。具体解读源码：
- 如果 oldStartVnode 不存在，则直接跳过，将 oldStartIdx 加 1，比对下一个

```js
// 以"新前"、"新后"、"旧前"、"旧后"的方式开始比对节点
while (oldStartIdx <= oldEndIdx && newStartIdx <= newEndIdx) {
  if (isUndef(oldStartVnode)) {
    oldStartVnode = oldCh[++oldStartIdx];
  }
}
```

- 如果 oldEndVnode 不存在，则直接跳过，将 oldEndIdx 减 1，比对前一个

```js
else if (isUndef(oldEndVnode)) {
    oldEndVnode = oldCh[--oldEndIdx]
}
```

- 如果新前与旧前节点相同，就把两个节点进行 patch 更新，同时 oldStartIdx 和
  newStartIdx 都加 1，后移一个位置

```js
else if (sameVnode(oldStartVnode, newStartVnode)) {
    patchVnode(oldStartVnode, newStartVnode, insertedVnodeQueue)
    oldStartVnode = oldCh[++oldStartIdx]
    newStartVnode = newCh[++newStartIdx]
}
```

- 如果新后与旧后节点相同，就把两个节点进行 patch 更新，同时 oldEndIdx 和
  newEndIdx 都减 1，前移一个位置

```js
else if (sameVnode(oldEndVnode, newEndVnode)) {
    patchVnode(oldEndVnode, newEndVnode, insertedVnodeQueue)
    oldEndVnode = oldCh[--oldEndIdx]
    newEndVnode = newCh[--newEndIdx]
}
```

- 如果新后与旧前节点相同，先把两个节点进行 patch 更新，然后把旧前节点移动到
  oldChilren 中所有未处理节点之后，最后把 oldStartIdx 加 1，后移一个位置
  ，newEndIdx 减 1，前移一个位置

```js
else if (sameVnode(oldStartVnode, newEndVnode)) {
    patchVnode(oldStartVnode, newEndVnode, insertedVnodeQueue)
    canMove && nodeOps.insertBefore(parentElm, oldStartVnode.elm, nodeOps.nextSibling(oldEndVnode.elm))
    oldStartVnode = oldCh[++oldStartIdx]
    newEndVnode = newCh[--newEndIdx]
}
```

- 如果新前与旧后节点相同，先把两个节点进行 patch 更新，然后把旧后节点移动到
  oldChilren 中所有未处理节点之前，最后把 newStartIdx 加 1，后移一个位置
  ，oldEndIdx 减 1，前移一个位置

```js
else if (sameVnode(oldEndVnode, newStartVnode)) { // Vnode moved left
    patchVnode(oldEndVnode, newStartVnode, insertedVnodeQueue)
    canMove && nodeOps.insertBefore(parentElm, oldEndVnode.elm, oldStartVnode.elm)
    oldEndVnode = oldCh[--oldEndIdx]
    newStartVnode = newCh[++newStartIdx]
}
```

`如果不属于以上四种情况，就进行常规的循环比对patch;`

- 如果在循环中，oldStartIdx 大于 oldEndIdx 了，那就表示 oldChildren 比
  newChildren 先循环完毕，那么 newChildren 里面剩余的节点都是需要新增的节点，
  把[newStartIdx, newEndIdx]之间的所有节点都插入到 DOM 中

```js
if (oldStartIdx > oldEndIdx) {
  refElm = isUndef(newCh[newEndIdx + 1]) ? null : newCh[newEndIdx + 1].elm;
  addVnodes(
    parentElm,
    refElm,
    newCh,
    newStartIdx,
    newEndIdx,
    insertedVnodeQueue,
  );
}
```

- 如果在循环中，newStartIdx 大于 newEndIdx 了，那就表示 newChildren 比
  oldChildren 先循环完毕，那么 oldChildren 里面剩余的节点都是需要删除的节点，
  把[oldStartIdx, oldEndIdx]之间的所有节点都删除

```js
else if (newStartIdx > newEndIdx) {
    removeVnodes(parentElm, oldCh, oldStartIdx, oldEndIdx)
}
```

这也是 vue 虚拟 dom 的 diff 过程。
