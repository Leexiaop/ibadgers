---
title: 虚拟DOM篇
order: 4
group: vue2
toc: content
---

作为一个前端开发，虚拟 dom 对于我们来说是再熟悉不过的了，前端的三大框架中，虚拟
dom 或多或少的都有涉及过。

## 什么是虚拟 DOM?

所谓虚拟 dom 就是通过一个 js 对象来描述一个真是 dom 节点：

```html
<div class="a" id="b">我是内容</div>
```

转化成虚拟 dom:

```js
{
    tag:'div',        // 元素标签
    attrs:{           // 属性
        class:'a',
        id:'b'
    },
    text:'我是内容',  // 文本内容
    children:[]       // 子元素
}
```

这就是虚拟 dom。

## 为什么需要虚拟 DOM?

我们知道，浏览器的标准就把 dom 设计的非常复杂，所以一个真是的 dom 元素就会非常的
庞大。像 vue 这种数据驱动视图更新的技术栈，当数据更新后，要更新视图就会付出非常
大的代价。但是又不能不操作 dom。于是乎，`虚拟dom`出现了。

可以通过 js 对象来模拟真是的 dom 节点，然后通过 js 的计算出哪些 dom 不需要更新，
哪些需要更新，只需要更新需要更新的那部分 dom。就会大大减少 dom 更新的消耗。这就
是虚拟 dom 产生的原因和最大用途。

## vue 中的虚拟 dom

### VNode 类

上面说过虚拟 dom 就是一个 js 对象，vue 中通过 VNode 类来实现这个虚拟 dom:

```js
// 源码位置：src/core/vdom/vnode.js

export default class VNode {
  constructor(
    tag?: string,
    data?: VNodeData,
    children?: ?Array<VNode>,
    text?: string,
    elm?: Node,
    context?: Component,
    componentOptions?: VNodeComponentOptions,
    asyncFactory?: Function,
  ) {
    this.tag = tag; /*当前节点的标签名*/
    this.data =
      data; /*当前节点对应的对象，包含了具体的一些数据信息，是一个VNodeData类型，可以参考VNodeData类型中的数据信息*/
    this.children = children; /*当前节点的子节点，是一个数组*/
    this.text = text; /*当前节点的文本*/
    this.elm = elm; /*当前虚拟节点对应的真实dom节点*/
    this.ns = undefined; /*当前节点的名字空间*/
    this.context = context; /*当前组件节点对应的Vue实例*/
    this.fnContext = undefined; /*函数式组件对应的Vue实例*/
    this.fnOptions = undefined;
    this.fnScopeId = undefined;
    this.key = data && data.key; /*节点的key属性，被当作节点的标志，用以优化*/
    this.componentOptions = componentOptions; /*组件的option选项*/
    this.componentInstance = undefined; /*当前节点对应的组件的实例*/
    this.parent = undefined; /*当前节点的父节点*/
    this.raw = false; /*简而言之就是是否为原生HTML或只是普通文本，innerHTML的时候为true，textContent的时候为false*/
    this.isStatic = false; /*静态节点标志*/
    this.isRootInsert = true; /*是否作为跟节点插入*/
    this.isComment = false; /*是否为注释节点*/
    this.isCloned = false; /*是否为克隆节点*/
    this.isOnce = false; /*是否有v-once指令*/
    this.asyncFactory = asyncFactory;
    this.asyncMeta = undefined;
    this.isAsyncPlaceholder = false;
  }

  get child(): Component | void {
    return this.componentInstance;
  }
}
```

从上面的代码可以看出，通过不同属性之间的组合，就可以描述出不同类型的真实 dom 节
点。

### VNode 类型

通过不同属性的组合，VNode 可以描述 6 种不同类型的真实 dom 节点。

- 注释节点
- 文本节点
- 元素节点
- 克隆节点
- 组件节点
- 函数式组件节点

#### 注释节点

```js
// 创建注释节点
export const createEmptyVNode = (text: string = '') => {
  const node = new VNode();
  node.text = text;
  node.isComment = true;
  return node;
};
```

从上面代码中可以看到，描述一个注释节点只需两个属性，分别是：text 和 isComment。
其中 text 属性表示具体的注释信息，isComment 是一个标志，用来标识一个节点是否是注
释节点。

#### 文本节点

```js
// 创建文本节点
export function createTextVNode(val: string | number) {
  return new VNode(undefined, undefined, undefined, String(val));
}
```

文本节点描述起来比注释节点更简单，因为它只需要一个属性，那就是 text 属性，用来表
示具体的文本信息。

#### 克隆节点

```js
// 创建克隆节点
export function cloneVNode(vnode: VNode): VNode {
  const cloned = new VNode(
    vnode.tag,
    vnode.data,
    vnode.children,
    vnode.text,
    vnode.elm,
    vnode.context,
    vnode.componentOptions,
    vnode.asyncFactory,
  );
  cloned.ns = vnode.ns;
  cloned.isStatic = vnode.isStatic;
  cloned.key = vnode.key;
  cloned.isComment = vnode.isComment;
  cloned.fnContext = vnode.fnContext;
  cloned.fnOptions = vnode.fnOptions;
  cloned.fnScopeId = vnode.fnScopeId;
  cloned.asyncMeta = vnode.asyncMeta;
  cloned.isCloned = true;
  return cloned;
}
```

克隆节点就是把一个已经存在的节点复制一份出来，它主要是为了做模板编译优化时使用,
而现有节点和新克隆得到的节点之间唯一的不同就是克隆得到的节点 isCloned 为 true。

#### 元素节点

```js
// 真实DOM节点
<div id='a'><span>世界那么大</span></div>

// VNode节点
{
    tag:'div',
    data:{},
    children:[
        {
            tag:'span',
            text:'世界那么大'
        }
    ]
}
```

相比之下，元素节点更贴近于我们通常看到的真实 DOM 节点，它有描述节点标签名词的
tag 属性，描述节点属性如 class、attributes 等的 data 属性，有描述包含的子节点信
息的 children 属性等。我们可以看到，真实 DOM 节点中:div 标签里面包含了一个 span
标签，而 span 标签里面有一段文本。反应到 VNode 节点上就如上所示:tag 表示标签名
，data 表示标签的属性 id 等，children 表示子节点数组。

#### 组件节点

组件节点除了有元素节点具有的属性之外，它还有两个特有的属性：

- componentOptions :组件的 option 选项，如组件的 props 等
- componentInstance :当前组件节点对应的 Vue 实例

#### 函数式组件节点

函数式组件节点相较于组件节点，它又有两个特有的属性：

- fnContext:函数式组件对应的 Vue 实例
- fnOptions: 组件的 option 选项

其实 VNode 的作用是相当大的。我们在视图渲染之前，把写好的 template 模板先编译成
VNode 并缓存下来，等到数据发生变化页面需要重新渲染的时候，我们把数据发生变化后生
成的 VNode 与前一次缓存下来的 VNode 进行对比，找出差异，然后有差异的 VNode 对应
的真实 DOM 节点就是需要重新渲染的节点，最后根据有差异的 VNode 创建出真实的 DOM
节点再插入到视图中，最终完成一次视图更新。
