---
title: Vue2的diff过程
group: vue
toc: content
---

vue2 的 diff 过程也就叫 patch 的过程，也就是新旧虚拟 dom 的比对过程，以新的虚拟
dom 为基准，对旧的虚拟 dom 进行改造，最终使得旧的虚拟 dom 和新的虚拟 dom 一样的
过程。这就是 vue2 的 diff 过程。

我们知道，在模版解析的过程中，虚拟 dom 有六种：

- 注释节点
- 文本节点
- 元素节点
- 组件节点
- 函数组件节点
- 克隆节点

实际在 patch 的过程中，只会对注释节点，文本节点和元素节点做出 diff。

### 创建节点

- 判断是否为元素节点只需判断该 VNode 节点是否有 tag 标签即可。如果有 tag 属性
  即认为是元素节点，则调用 createElement 方法创建元素节点，通常元素节点还会有
  子节点，那就递归遍历创建所有子节点，将所有子节点创建好之后 insert 插入到当前
  元素节点里面，最后把当前元素节点插入到 DOM 中。

- 判断是否为注释节点，只需判断 VNode 的 isComment 属性是否为 true 即可，若为
  true 则为注释节点，则调用 createComment 方法创建注释节点，再插入到 DOM 中。

- 如果既不是元素节点，也不是注释节点，那就认为是文本节点，则调用
  createTextNode 方法创建文本节点，再插入到 DOM 中。

```js
// 源码位置: /src/core/vdom/patch.js
function createElm(vnode, parentElm, refElm) {
  const data = vnode.data;
  const children = vnode.children;
  const tag = vnode.tag;
  if (isDef(tag)) {
    vnode.elm = nodeOps.createElement(tag, vnode); // 创建元素节点
    createChildren(vnode, children, insertedVnodeQueue); // 创建元素节点的子节点
    insert(parentElm, vnode.elm, refElm); // 插入到DOM中
  } else if (isTrue(vnode.isComment)) {
    vnode.elm = nodeOps.createComment(vnode.text); // 创建注释节点
    insert(parentElm, vnode.elm, refElm); // 插入到DOM中
  } else {
    vnode.elm = nodeOps.createTextNode(vnode.text); // 创建文本节点
    insert(parentElm, vnode.elm, refElm); // 插入到DOM中
  }
}
```

### 删除节点

如果某些节点再新的 VNode 中没有而在旧的 oldVNode 中有，那么就需要把这些节点从旧
的 oldVNode 中删除。删除节点非常简单，只需在要删除节点的父元素上调用 removeChild
方法即可。

```js
function removeNode(el) {
  const parent = nodeOps.parentNode(el); // 获取父节点
  if (isDef(parent)) {
    nodeOps.removeChild(parent, el); // 调用父节点的removeChild方法
  }
}
```

### 更新节点

更新子节点相对比较复杂。

- 是不是静态节点，如果是，那么不需要做任何处理，因为静态节点不会随着数据的变化
  而变话，静态节点一旦创建，就不会再改变。
- 是不是文本节点，如果 VNode 是文本节点即表示这个节点内只包含纯文本，那么只需
  看 oldVNode 是否也是文本节点，如果是，那就比较两个文本是否不同，如果不同则把
  oldVNode 里的文本改成跟 VNode 的文本一样。如果 oldVNode 不是文本节点，那么不
  论它是什么，直接调用 setTextNode 方法把它改成文本节点，并且文本内容跟 VNode
  相同。
- 是不是元素节点，
  - 有子节点，如果新的节点内包含了子节点，那么此时要看旧的节点是否包含子节点
    ，如果旧的节点里也包含了子节点，那就需要递归对比更新子节点；如果旧的节点
    里不包含子节点，那么这个旧节点有可能是空节点或者是文本节点，如果旧的节点
    是空节点就把新的节点里的子节点创建一份然后插入到旧的节点里面，如果旧的节
    点是文本节点，则把文本清空，然后把新的节点里的子节点创建一份然后插入到旧
    的节点里面。
  - 无子节点，如果该节点不包含子节点，同时它又不是文本节点，那就说明该节点是
    个空节点，那就好办了，不管旧节点之前里面都有啥，直接清空即可。

```js
// 更新节点
function patchVnode(oldVnode, vnode, insertedVnodeQueue, removeOnly) {
  // vnode与oldVnode是否完全一样？若是，退出程序
  if (oldVnode === vnode) {
    return;
  }
  const elm = (vnode.elm = oldVnode.elm);

  // vnode与oldVnode是否都是静态节点？若是，退出程序
  if (
    isTrue(vnode.isStatic) &&
    isTrue(oldVnode.isStatic) &&
    vnode.key === oldVnode.key &&
    (isTrue(vnode.isCloned) || isTrue(vnode.isOnce))
  ) {
    return;
  }

  const oldCh = oldVnode.children;
  const ch = vnode.children;
  // vnode有text属性？若没有：
  if (isUndef(vnode.text)) {
    // vnode的子节点与oldVnode的子节点是否都存在？
    if (isDef(oldCh) && isDef(ch)) {
      // 若都存在，判断子节点是否相同，不同则更新子节点
      if (oldCh !== ch)
        updateChildren(elm, oldCh, ch, insertedVnodeQueue, removeOnly);
    }
    // 若只有vnode的子节点存在
    else if (isDef(ch)) {
      /**
       * 判断oldVnode是否有文本？
       * 若没有，则把vnode的子节点添加到真实DOM中
       * 若有，则清空Dom中的文本，再把vnode的子节点添加到真实DOM中
       */
      if (isDef(oldVnode.text)) nodeOps.setTextContent(elm, '');
      addVnodes(elm, null, ch, 0, ch.length - 1, insertedVnodeQueue);
    }
    // 若只有oldnode的子节点存在
    else if (isDef(oldCh)) {
      // 清空DOM中的子节点
      removeVnodes(elm, oldCh, 0, oldCh.length - 1);
    }
    // 若vnode和oldnode都没有子节点，但是oldnode中有文本
    else if (isDef(oldVnode.text)) {
      // 清空oldnode文本
      nodeOps.setTextContent(elm, '');
    }
    // 上面两个判断一句话概括就是，如果vnode中既没有text，也没有子节点，那么对应的oldnode中有什么就清空什么
  }
  // 若有，vnode的text属性与oldVnode的text属性是否相同？
  else if (oldVnode.text !== vnode.text) {
    // 若不相同：则用vnode的text替换真实DOM的文本
    nodeOps.setTextContent(elm, vnode.text);
  }
}
```

### 更新子节点

对于子节点的更新，应该只有四种，创建，删除，移动和更新。vue 将新的子节点数组称为
newChildren，旧的子节点数组称为 oldChildren。通过双层遍历来比对子节点数组。

- 创建子节点

如果 newChildren 里面的某个子节点在 oldChildren 里找不到与之相同的子节点，那么说
明 newChildren 里面的这个子节点是之前没有的，是需要此次新增的节点，那么就创建子
节点。

- 删除子节点

如果把 newChildren 里面的每一个子节点都循环完毕后，发现在 oldChildren 还有未处理
的子节点，那就说明这些未处理的子节点是需要被废弃的，那么就将这些节点删除。

- 移动子节点

如果 newChildren 里面的某个子节点在 oldChildren 里找到了与之相同的子节点，但是所
处的位置不同，这说明此次变化需要调整该子节点的位置，那就以 newChildren 里子节点
的位置为基准，调整 oldChildren 里该节点的位置，使之与在 newChildren 里的位置相同
。

- 更新节点

如果 newChildren 里面的某个子节点在 oldChildren 里找到了与之相同的子节点，并且所
处的位置也相同，那么就更新 oldChildren 里该节点，使之与 newChildren 里的该节点相
同。

### 更新子节点的优化

这里处理的是所有的子节点数组中未被处理的节点：

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
