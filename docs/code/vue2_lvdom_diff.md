---
title: 虚拟DOM篇之Diff过程
order: 5
group: vue2
toc: content
---

上一篇，我们讲过，虚拟 DOM 的生成，其最大的用途就是比对`新旧DOM`的不同。比对的过
程就是 Diff 的过程，就是找出不同的过程。

## patch 过程

在 Vue 中，比对虚拟 dom 的过程被称作是 patch 的过程，patch 的过程，就是比对，数
据更新前后虚拟 dom 的差别，所以
，`以新的VNode为基准，改造旧的oldVNode，使之成为和新的VNode一样。`，所以 patch
的过程就干了三件事儿：

- 创建节点：新的 VNode 中有而旧的 oldVNode 中没有，就在旧的 oldVNode 中创建。
- 删除节点：新的 VNode 中没有而旧的 oldVNode 中有，就从旧的 oldVNode 中删除。
- 更新节点：新的 VNode 和旧的 oldVNode 中都有，就以新的 VNode 为准，更新旧的
  oldVNode。

## 创建节点

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

事实上，在 vue 中能被创建出的节点只有三中，分别是元素节点，文本节点，注释节点，
所以在创建节点的时候，会判断应该创建哪种节点。从上面的代码中可以看出：

- 判断是否为元素节点只需判断该 VNode 节点是否有 tag 标签即可。如果有 tag 属性
  即认为是元素节点，则调用 createElement 方法创建元素节点，通常元素节点还会有
  子节点，那就递归遍历创建所有子节点，将所有子节点创建好之后 insert 插入到当前
  元素节点里面，最后把当前元素节点插入到 DOM 中。
- 判断是否为注释节点，只需判断 VNode 的 isComment 属性是否为 true 即可，若为
  true 则为注释节点，则调用 createComment 方法创建注释节点，再插入到 DOM 中。
- 如果既不是元素节点，也不是注释节点，那就认为是文本节点，则调用
  createTextNode 方法创建文本节点，再插入到 DOM 中。 `注：`nodeOps 是 vue 为了
  跨平台兼容性，对所有节点操作的封装。

整个流程:

![vue创建VNode流程](https://leexiaop.github.io/static/ibadgers/code/vue2/create_ele.png)

## 删除节点

```js
function removeNode(el) {
  const parent = nodeOps.parentNode(el); // 获取父节点
  if (isDef(parent)) {
    nodeOps.removeChild(parent, el); // 调用父节点的removeChild方法
  }
}
```

如果某些节点再新的 VNode 中没有而在旧的 oldVNode 中有，那么就需要把这些节点从旧
的 oldVNode 中删除。删除节点非常简单，只需在要删除节点的父元素上调用 removeChild
方法即可。

## 更新节点

创建节点和删除节点相对比较简单，而更新节点就不是那么容易了，先看源码：

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

1. 如果 VNode 和 oldVNode 都是静态节点(不管数据再怎么变化，只要这个节点第一次渲
   染了，那么它以后就永远不会发生变化，这是因为它不包含任何变量，所以数据发生任
   何变化都与它无关，比如纯文字)

   直接跳出，因为静态节点不随着数据变化而变化，无需处理。

2. 如果是文本节点

   如果 VNode 是文本节点即表示这个节点内只包含纯文本，那么只需看 oldVNode 是否
   也是文本节点，如果是，那就比较两个文本是否不同，如果不同则把 oldVNode 里的文
   本改成跟 VNode 的文本一样。如果 oldVNode 不是文本节点，那么不论它是什么，直
   接调用 setTextNode 方法把它改成文本节点，并且文本内容跟 VNode 相同。

3. 如果 VNode 是元素节点

   - 该节点包含子节点

     如果新的节点内包含了子节点，那么此时要看旧的节点是否包含子节点，如果旧的
     节点里也包含了子节点，那就需要递归对比更新子节点；如果旧的节点里不包含子
     节点，那么这个旧节点有可能是空节点或者是文本节点，如果旧的节点是空节点就
     把新的节点里的子节点创建一份然后插入到旧的节点里面，如果旧的节点是文本节
     点，则把文本清空，然后把新的节点里的子节点创建一份然后插入到旧的节点里面
     。

   - 该节点不包含子节点

     如果该节点不包含子节点，同时它又不是文本节点，那就说明该节点是个空节点，
     那就好办了，不管旧节点之前里面都有啥，直接清空即可。

整体的流程：

![vue中VNode更新流程](https://leexiaop.github.io/static/ibadgers/code/vue2/vnode_update.png)

你可能注意到了，如果新旧 VNode 里都包含了子节点，那么对于子节点的更新在代码里调
用了 updateChildren 方法.下一张学习这个方法。
