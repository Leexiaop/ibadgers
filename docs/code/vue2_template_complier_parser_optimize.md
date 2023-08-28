---
title: 模版编译篇之文本解析器优化
order: 11
group: vue2
toc: content
---

模版编译的优化，主要是对静态文本的优化,首先要明确俩个概念：

静态节点：一旦第一次被渲染成 DOM 节点以后，之后不管状态再怎么变化他都不会再变，
我们把这种节点称之为静态节点。

静态根节点：这些静态节点的根节点称之为静态根节点。

模板编译的最终目的是用模板生成一个 render 函数，而用 render 函数就可以生成与模板
对应的 VNode，之后再进行 patch 算法，最后完成视图渲染。这中间的 patch 算法又是用
来对比新旧 VNode 之间存在的差异。静态节点不管状态怎么变化它是不会变的，基于此，
那我们就可以在 patch 过程中不用去对比这些静态节点了，这样不就又可以提高一些性能
了吗？所以我们在模板编译的时候就先找出模板中所有的静态节点和静态根节点，然后给它
们打上标记，用于告诉后面 patch 过程打了标记的这些节点是不需要对比的，你只要把它
们克隆一份去用就好啦。这就是优化阶段存在的意义。所以，优化阶段只做了俩件事：

- 在 AST 中找出所有静态节点并打上标记；
- 在 AST 找出所有静态跟节点并打上标记；

```js
//  src/compiler/optimizer.js
export function optimize(root: ?ASTElement, options: CompilerOptions) {
  if (!root) return;
  isStaticKey = genStaticKeysCached(options.staticKeys || '');
  isPlatformReservedTag = options.isReservedTag || no;
  // 标记静态节点
  markStatic(root);
  // 标记静态根节点
  markStaticRoots(root, false);
}
```

## 标记静态节点

从 AST 中找出所有静态节点并标记其实不难，我们只需从根节点开始，先标记根节点是否
为静态节点，然后看根节点如果是元素节点，那么就去向下递归它的子节点，子节点如果还
有子节点那就继续向下递归，直到标记完所有节点。

```js
function markStatic(node: ASTNode) {
  node.static = isStatic(node);
  if (node.type === 1) {
    // do not make component slot content static. this avoids
    // 1. components not able to mutate slot nodes
    // 2. static slot content fails for hot-reloading
    if (
      !isPlatformReservedTag(node.tag) &&
      node.tag !== 'slot' &&
      node.attrsMap['inline-template'] == null
    ) {
      return;
    }
    for (let i = 0, l = node.children.length; i < l; i++) {
      const child = node.children[i];
      markStatic(child);
      if (!child.static) {
        node.static = false;
      }
    }
    if (node.ifConditions) {
      for (let i = 1, l = node.ifConditions.length; i < l; i++) {
        const block = node.ifConditions[i].block;
        markStatic(block);
        if (!block.static) {
          node.static = false;
        }
      }
    }
  }
}
```

在上面代码中，首先调用 isStatic 函数标记节点是否为静态节点，该函数若返回 true 表
示该节点是静态节点，若返回 false 表示该节点不是静态节点，函数实现如下：

```js
function isStatic(node: ASTNode): boolean {
  if (node.type === 2) {
    // 包含变量的动态文本节点
    return false;
  }
  if (node.type === 3) {
    // 不包含变量的纯文本节点
    return true;
  }
  return !!(
    node.pre ||
    (!node.hasBindings && // no dynamic bindings
      !node.if &&
      !node.for && // not v-if or v-for or v-else
      !isBuiltInTag(node.tag) && // not a built-in
      isPlatformReservedTag(node.tag) && // not a component
      !isDirectChildOfTemplateFor(node) &&
      Object.keys(node).every(isStaticKey))
  );
}
```

该函数的实现过程其实也说明了如何判断一个节点是否为静态节点。还记得在 HTML 解析器
在调用钩子函数创建 AST 节点时会根据节点类型的不同为节点加上不同的 type 属性，用
type 属性来标记 AST 节点的节点类型:

- 1:元素节点
- 2:包含变量的动态文本节点
- 3:不包含变量的纯文本节点

所以在判断一个节点是否为静态节点时首先会根据 type 值判断节点类型，如果 type 值为
2，那么该节点是包含变量的动态文本节点，它就肯定不是静态节点，返回 false；如果
type 值为 2，那么该节点是不包含变量的纯文本节点，它就肯定是静态节点，返回 true；
如果 type 值为 1,说明该节点是元素节点，那就需要进一步判断。

如果元素节点是静态节点，那就必须满足以下几点要求：

- 如果节点使用了 v-pre 指令，那就断定它是静态节点；
- 如果节点没有使用 v-pre 指令，那它要成为静态节点必须满足：
  - 不能使用动态绑定语法，即标签上不能有 v-、@、:开头的属性；
  - 不能使用 v-if、v-else、v-for 指令；
  - 不能是内置组件，即标签名不能是 slot 和 component；
  - 标签名必须是平台保留标签，即不能是组件；
  - 当前节点的父节点不能是带有 v-for 的 template 标签；
  - 节点的所有属性的 key 都必须是静态节点才有的 key，注：静态节点的 key 是有
    限的，它只能是 type,tag,attrsList,attrsMap,plain,parent,children,attrs
    之一；

标记完当前节点是否为静态节点之后，如果该节点是元素节点，那么还要继续去递归判断它
的子节点。

```js
for (let i = 0, l = node.children.length; i < l; i++) {
  const child = node.children[i];
  markStatic(child);
  if (!child.static) {
    node.static = false;
  }
}
```

这里新增了一个 child.static 的判断。这个判断的意思是如果当前节点的子节点有一个不
是静态节点，那就把当前节点也标记为非静态节点。为什么要这么做呢？这是因为我们在判
断的时候是从上往下判断的，也就是说先判断当前节点，再判断当前节点的子节点，如果当
前节点在一开始被标记为了静态节点，但是通过判断子节点的时候发现有一个子节点却不是
静态节点，这就有问题了，我们之前说过一旦标记为静态节点，就说明这个节点首次渲染之
后不会再发生任何变化，但是它的一个子节点却又是可以变化的，就出现了自相矛盾，所以
我们需要当发现它的子节点中有一个不是静态节点的时候，就得把当前节点重新设置为非静
态节点。

循环 node.children 后还不算把所有子节点都遍历完，因为如果当前节点的子节点中有标
签带有 v-if、v-else-if、v-else 等指令时，这些子节点在每次渲染时都只渲染一个，所
以其余没有被渲染的肯定不在 node.children 中，而是存在于 node.ifConditions，所以
我们还要把 node.ifConditions 循环一遍，如下：

```js
if (node.ifConditions) {
  for (let i = 1, l = node.ifConditions.length; i < l; i++) {
    const block = node.ifConditions[i].block;
    markStatic(block);
    if (!block.static) {
      node.static = false;
    }
  }
}
```

同理，如果当前节点的 node.ifConditions 中有一个子节点不是静态节点也要将当前节点
设置为非静态节点。

以上就是标记静态节点的全部逻辑。

## 标记静态根节点

寻找静态根节点根寻找静态节点的逻辑类似，都是从 AST 根节点递归向下遍历寻找:

```js
function markStaticRoots(node: ASTNode, isInFor: boolean) {
  if (node.type === 1) {
    if (node.static || node.once) {
      node.staticInFor = isInFor;
    }
    // For a node to qualify as a static root, it should have children that
    // are not just static text. Otherwise the cost of hoisting out will
    // outweigh the benefits and it's better off to just always render it fresh.
    if (
      node.static &&
      node.children.length &&
      !(node.children.length === 1 && node.children[0].type === 3)
    ) {
      node.staticRoot = true;
      return;
    } else {
      node.staticRoot = false;
    }
    if (node.children) {
      for (let i = 0, l = node.children.length; i < l; i++) {
        markStaticRoots(node.children[i], isInFor || !!node.for);
      }
    }
    if (node.ifConditions) {
      for (let i = 1, l = node.ifConditions.length; i < l; i++) {
        markStaticRoots(node.ifConditions[i].block, isInFor);
      }
    }
  }
}
```

上面代码中，首先 markStaticRoots 第二个参数是 isInFor，对于已经是 static 的节点
或者是 v-once 指令的节点，node.staticInFor = isInFor.接着判断该节点是否为静态根
节点:

```js
// For a node to qualify as a static root, it should have children that
// are not just static text. Otherwise the cost of hoisting out will
// outweigh the benefits and it's better off to just always render it fresh.
// 为了使节点有资格作为静态根节点，它应具有不只是静态文本的子节点。 否则，优化的成本将超过收益，最好始终将其更新。
if (
  node.static &&
  node.children.length &&
  !(node.children.length === 1 && node.children[0].type === 3)
) {
  node.staticRoot = true;
  return;
} else {
  node.staticRoot = false;
}
```

从代码和注释中我们可以看到，一个节点要想成为静态根节点，它必须满足以下要求：

- 节点本身必须是静态节点；
- 必须拥有子节点 children；
- 子节点不能只是只有一个文本节点；否则的话，对它的优化成本将大于优化后带来的收
  益。

如果当前节点不是静态根节点，那就继续递归遍历它的子节点 node.children 和
node.ifConditions，如下：

```js
if (node.children) {
  for (let i = 0, l = node.children.length; i < l; i++) {
    markStaticRoots(node.children[i], isInFor || !!node.for);
  }
}
if (node.ifConditions) {
  for (let i = 1, l = node.ifConditions.length; i < l; i++) {
    markStaticRoots(node.ifConditions[i].block, isInFor);
  }
}
```

这里的原理跟寻找静态节点相同，此处就不再重复。
