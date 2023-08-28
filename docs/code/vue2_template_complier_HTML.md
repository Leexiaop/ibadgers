---
title: 模版编译篇之HTML解析器
order: 9
group: vue2
toc: content
---

上篇我们说过，模版解析的主函数 parse 会根据解析的内容不同会调用不同的解析器。那
么最重要的就是 HTML 解析器，因为只有先将类似于 HTML 的 HTML 字符串解析后才能判断
后续调用哪个解析器。源码中可以看到 htmlParse 在主函数 parse 中的调用方式：

```js
// 代码位置：/src/complier/parser/index.js

/**
 * Convert HTML string to AST.
 * 将HTML模板字符串转化为AST
 */
export function parse(template, options) {
  // ...
  parseHTML(template, {
    warn,
    expectHTML: options.expectHTML,
    isUnaryTag: options.isUnaryTag,
    canBeLeftOpenTag: options.canBeLeftOpenTag,
    shouldDecodeNewlines: options.shouldDecodeNewlines,
    shouldDecodeNewlinesForHref: options.shouldDecodeNewlinesForHref,
    shouldKeepComment: options.comments,
    // 当解析到开始标签时，调用该函数
    start(tag, attrs, unary) {},
    // 当解析到结束标签时，调用该函数
    end() {},
    // 当解析到文本时，调用该函数
    chars(text) {},
    // 当解析到注释时，调用该函数
    comment(text) {},
  });
  return root;
}
```

## HTML 解析器内部运行流程

从调用的函数来看，parseHTML 接受了俩个参数，第一个是待解析的 template 字符串，无
须多言，第二个转换时所需要的选项。最重要的是还定义了四个勾子函数。我们知道，主函
数 parse 是将 template 转化成 AST 树的过程，那么 parseHTML 和她的四个勾子函数，
就是分别做了不同阶段的任务。

- 当解析到开始标签时调用 start 函数生成元素类型的 AST 节点

```js
// 当解析到标签的开始位置时，触发start
start (tag, attrs, unary) {
	let element = createASTElement(tag, attrs, currentParent)
}

export function createASTElement (tag,attrs,parent) {
    return {
        type: 1,
        tag,
        attrsList: attrs,
        attrsMap: makeAttrsMap(attrs),
        parent,
        children: []
    }
}
```

start 函数接收三个参数，分别是标签名 tag、标签属性 attrs、标签是否自闭合 unary。
当调用该钩子函数时，内部会调用 createASTElement 函数来创建元素类型的 AST 节点.

- 当解析到结束标签时调用 end 函数；

- 当解析到文本时调用 chars 函数生成文本类型的 AST 节点

```js
// 当解析到标签的文本时，触发chars
chars (text) {
	if(text是带变量的动态文本){
        let element = {
            type: 2,
            expression: res.expression,
            tokens: res.tokens,
            text
        }
    } else {
        let element = {
            type: 3,
            text
        }
    }
}
```

当解析到标签的文本时，触发 chars 钩子函数，在该钩子函数内部，首先会判断文本是不
是一个带变量的动态文本，如“hello ”。如果是动态文本，则创建动态文本类型的 AST 节
点；如果不是动态文本，则创建纯静态文本类型的 AST 节点。

- 当解析到注释时调用 comment 函数生成注释类型的 AST 节点

```js
// 当解析到标签的注释时，触发comment
comment (text: string) {
    let element = {
        type: 3,
        text,
        isComment: true
    }
}
```

当解析到标签的注释时，触发 comment 钩子函数，该钩子函数会创建一个注释类型的 AST
节点。

一边解析不同的内容一边调用对应的钩子函数生成对应的 AST 节点，最终完成将整个模板
字符串转化成 AST,这就是 HTML 解析器所要做的工作。

## 如何解析不同的内容

说的直接一点，就是通过编写不同的正则表达式来解析不同的内容:

- 文本
- 开始标签
- 结束标签
- HTML 注释
- 条件注释
- DOCTYPE

### HTML 注释解析

HTML 注释的解析是比较简单的，只要找到以为<! -- 开头 -->结尾,以及之间的内容就是
HTML 注释的内容。

```js
const comment = /^<!\--/
if (comment.test(html)) {
    // 若为注释，则继续查找是否存在'-->'
    const commentEnd = html.indexOf('-->')

    if (commentEnd >= 0) {
        // 若存在 '-->',继续判断options中是否保留注释
        if (options.shouldKeepComment) {
            // 若保留注释，则把注释截取出来传给options.comment，创建注释类型的AST节点
            options.comment(html.substring(4, commentEnd))
        }
        // 若不保留注释，则将游标移动到'-->'之后，继续向后解析
        advance(commentEnd + 3)
        continue
    }
}
```

在代码中可以看到，如果模板字符串 html 符合注释开始的正则，那么就继续向后查找是否
存在-->，若存在，则把 html 从第 4 位（"<! --"长度为 4）开始截取，直到-->处，截取
得到的内容就是注释的真实内容，然后调用 4 个钩子函数中的 comment 函数，将真实的注
释内容传进去，创建注释类型的 AST 节点。

上面代码中有一处值得注意的地方，那就是我们平常在模板中可以
在<template></template>标签上配置 comments 选项来决定在渲染模板时是否保留注释，
对应到上面代码中就是 options.shouldKeepComment,如果用户配置了 comments 选项为
true，则 shouldKeepComment 为 true，则创建注释类型的 AST 节点，如不保留注释，则
将游标移动到'-->'之后，继续向后解析。

advance 函数是用来移动解析游标的，解析完一部分就把游标向后移动一部分，确保不会重
复解析。

```js
function advance(n) {
  index += n; // index为解析游标
  html = html.substring(n);
}
```

### 条件注释解析

条件注释是这样的：<! -- [if !IE]> -->我是注释<! --< ![endif] --> 那么我们 vue 依
然会是用正则的方式去查询，如果能找到，就将其内容截取出来。由于条件注释不存在于真
正的 DOM 树中，所以不需要调用钩子函数创建 AST 节点。

```js
// 解析是否是条件注释
const conditionalComment = /^<!\[/
if (conditionalComment.test(html)) {
    // 若为条件注释，则继续查找是否存在']>'
    const conditionalEnd = html.indexOf(']>')

    if (conditionalEnd >= 0) {
        // 若存在 ']>',则从原本的html字符串中把条件注释截掉，
        // 把剩下的内容重新赋给html，继续向后匹配
        advance(conditionalEnd + 2)
        continue
    }
}
```

### DOCTYPE 解析

```js
const doctype = /^<!DOCTYPE [^>]+>/i
// 解析是否是DOCTYPE
const doctypeMatch = html.match(doctype)
if (doctypeMatch) {
    advance(doctypeMatch[0].length)
    continue
}
```

### 解析开始标签

首先使用开始标签的正则去匹配模板字符串，看模板字符串是否具有开始标签的特征.

```js
/**
 * 匹配开始标签的正则
 */
const ncname = '[a-zA-Z_][\\w\\-\\.]*'
const qnameCapture = `((?:${ncname}\\:)?${ncname})`
const startTagOpen = new RegExp(`^<${qnameCapture}`)

const start = html.match(startTagOpen)
if (start) {
  const match = {
    tagName: start[1],
    attrs: [],
    start: index
  }
}

// 以开始标签开始的模板：
'<div></div>'.match(startTagOpen)  => ['<div','div',index:0,input:'<div></div>']
// 以结束标签开始的模板：
'</div><div></div>'.match(startTagOpen) => null
// 以文本开始的模板：
'我是文本</p>'.match(startTagOpen) => null
```

当解析到开始标签时，会调用 4 个钩子函数中的 start 函数，而 start 函数需要传递 3
个参数，分别是标签名 tag、标签属性 attrs、标签是否自闭合 unary。标签名通过正则匹
配的结果就可以拿到，即上面代码中的 start[1]，而标签属性 attrs 以及标签是否自闭合
unary 需要进一步解析。

- 解析标签属性

标签属性一般是写在开始标签的标签名之后:

```html
<div class="a" id="b"></div>
```

当我们拿到开始标签后，那么就剩下:

```html
class="a" id="b"></div>
```

那么我们只需用剩下的这部分去匹配标签属性的正则，就可以将标签属性提取出来了.

```js
const attribute =
  /^\s*([^\s"'<>\/=]+)(?:\s*(=)\s*(?:"([^"]*)"+|'([^']*)'+|([^\s"'=<>`]+)))?/;
let html = 'class="a" id="b"></div>';
let attr = html.match(attribute);
console.log(attr);
// ["class="a"", "class", "=", "a", undefined, undefined, index: 0, input: "class="a" id="b"></div>", groups: undefined]
```

可以看到，第一个标签属性 class="a"已经被拿到了。另外，标签属性有可能有多个也有可
能没有，如果没有的话那好办，匹配标签属性的正则就会匹配失败，标签属性就为空数组；
而如果标签属性有多个的话，那就需要循环匹配了，匹配出第一个标签属性后，就把该属性
截掉，用剩下的字符串继续匹配，直到不再满足正则为止. 在上面代码的 while 循环中，
如果剩下的字符串不符合开始标签的结束特征（startTagClose）并且符合标签属性的特征
的话，那就说明还有未提取出的标签属性，那就进入循环，继续提取，直到把所有标签属性
都提取完毕。

所谓不符合开始标签的结束特征是指当前剩下的字符串不是以开始标签结束符开头的，我们
知道一个开始标签的结束符有可能是一个>（非自闭合标签），也有可能是/>（自闭合标签
），如果剩下的字符串（如></div>）以开始标签的结束符开头，那么就表示标签属性已经
被提取完毕了。

- 解析标签是否是自闭合

在 HTML 中，有自闭合标签（如< img src="xxx.com/a.png"/>）也有非自闭合标签（如<
div></div>），这两种类型的标签在创建 AST 节点是处理方式是有区别的，所以我们需要
解析出当前标签是否是自闭合标签。解析的方式很简单，我们知道，经过标签属性提取之后
，那么剩下的字符串无非就两种：></div>和 />，所以我们可以用剩下的字符串去匹配开始
标签结束符正则：

```js
const startTagClose = /^\s*(\/?)>/;
let end = html.match(startTagClose);
'></div>'.match(startTagClose); // [">", "", index: 0, input: "></div>", groups: undefined]
'/>'.match(startTagClose); // ["/>", "/", index: 0, input: "/><div></div>", groups: undefined]
```

可以看到，非自闭合标签匹配结果中的 end[1]为""，而自闭合标签匹配结果中的 end[1]为
"/"。所以根据匹配结果的 end[1]是否是""我们即可判断出当前标签是否为自闭合标签，源
码如下：

```js
const startTagClose = /^\s*(\/?)>/;
let end = html.match(startTagClose);
if (end) {
  match.unarySlash = end[1];
  advance(end[0].length);
  match.end = index;
  return match;
}
```

经过以上两步，开始标签就已经解析完毕了，完整源码如下：

```js
const ncname = '[a-zA-Z_][\\w\\-\\.]*';
const qnameCapture = `((?:${ncname}\\:)?${ncname})`;
const startTagOpen = new RegExp(`^<${qnameCapture}`);
const startTagClose = /^\s*(\/?)>/;

function parseStartTag() {
  const start = html.match(startTagOpen);
  // '<div></div>'.match(startTagOpen)  => ['<div','div',index:0,input:'<div></div>']
  if (start) {
    const match = {
      tagName: start[1],
      attrs: [],
      start: index,
    };
    advance(start[0].length);
    let end, attr;
    /**
     * <div a=1 b=2 c=3></div>
     * 从<div之后到开始标签的结束符号'>'之前，一直匹配属性attrs
     * 所有属性匹配完之后，html字符串还剩下
     * 自闭合标签剩下：'/>'
     * 非自闭合标签剩下：'></div>'
     */
    while (
      !(end = html.match(startTagClose)) &&
      (attr = html.match(attribute))
    ) {
      advance(attr[0].length);
      match.attrs.push(attr);
    }

    /**
     * 这里判断了该标签是否为自闭合标签
     * 自闭合标签如:<input type='text' />
     * 非自闭合标签如:<div></div>
     * '></div>'.match(startTagClose) => [">", "", index: 0, input: "></div>", groups: undefined]
     * '/><div></div>'.match(startTagClose) => ["/>", "/", index: 0, input: "/><div></div>", groups: undefined]
     * 因此，我们可以通过end[1]是否是"/"来判断该标签是否是自闭合标签
     */
    if (end) {
      match.unarySlash = end[1];
      advance(end[0].length);
      match.end = index;
      return match;
    }
  }
}
```

通过源码可以看到，调用 parseStartTag 函数，如果模板字符串符合开始标签的特征，则
解析开始标签，并将解析结果返回，如果不符合开始标签的特征，则返回 undefined。

解析完毕后，就可以用解析得到的结果去调用 start 钩子函数去创建元素型的 AST 节点了
。

在源码中，Vue 并没有直接去调 start 钩子函数去创建 AST 节点，而是调用了
handleStartTag 函数，在该函数内部才去调的 start 钩子函数，为什么要这样做呢？这是
因为虽然经过 parseStartTag 函数已经把创建 AST 节点必要信息提取出来了，但是提取出
来的标签属性数组还是需要处理一下，下面我们就来看一下 handleStartTag 函数都做了些
什么事。handleStartTag 函数源码如下：

```js
function handleStartTag(match) {
  const tagName = match.tagName;
  const unarySlash = match.unarySlash;

  if (expectHTML) {
    // ...
  }

  const unary = isUnaryTag(tagName) || !!unarySlash;

  const l = match.attrs.length;
  const attrs = new Array(l);
  for (let i = 0; i < l; i++) {
    const args = match.attrs[i];
    const value = args[3] || args[4] || args[5] || '';
    const shouldDecodeNewlines =
      tagName === 'a' && args[1] === 'href'
        ? options.shouldDecodeNewlinesForHref
        : options.shouldDecodeNewlines;
    attrs[i] = {
      name: args[1],
      value: decodeAttr(value, shouldDecodeNewlines),
    };
  }

  if (!unary) {
    stack.push({
      tag: tagName,
      lowerCasedTag: tagName.toLowerCase(),
      attrs: attrs,
    });
    lastTag = tagName;
  }

  if (options.start) {
    options.start(tagName, attrs, unary, match.start, match.end);
  }
}
```

handleStartTag 函数用来对 parseStartTag 函数的解析结果进行进一步处理，它接收
parseStartTag 函数的返回值作为参数。 handleStartTag 函数的开始定义几个常量:

```js
const tagName = match.tagName; // 开始标签的标签名
const unarySlash = match.unarySlash; // 是否为自闭合标签的标志，自闭合为"",非自闭合为"/"
const unary = isUnaryTag(tagName) || !!unarySlash; // 布尔值，标志是否为自闭合标签
const l = match.attrs.length; // match.attrs 数组的长度
const attrs = new Array(l); // 一个与match.attrs数组长度相等的数组
```

接下来是循环处理提取出来的标签属性数组 match.attrs:

```js
for (let i = 0; i < l; i++) {
  const args = match.attrs[i];
  const value = args[3] || args[4] || args[5] || '';
  const shouldDecodeNewlines =
    tagName === 'a' && args[1] === 'href'
      ? options.shouldDecodeNewlinesForHref
      : options.shouldDecodeNewlines;
  attrs[i] = {
    name: args[1],
    value: decodeAttr(value, shouldDecodeNewlines),
  };
}
```

上面代码中，首先定义了 args 常量，它是解析出来的标签属性数组中的每一个属性对象，
即 match.attrs 数组中每个元素对象。 它长这样：

```js
const args = ["class="a"", "class", "=", "a", undefined, undefined, index: 0, input: "class="a" id="b"></div>", groups: undefined]
```

接着定义了 value，用于存储标签属性的属性值，我们可以看到，在代码中尝试取 args 的
args[3]、args[4]、args[5]，如果都取不到，则给 value 复制为空.

```js
const value = args[3] || args[4] || args[5] || '';
```

接着定义了 shouldDecodeNewlines，这个常量主要是做一些兼容性处理， 如果
shouldDecodeNewlines 为 true，意味着 Vue 在编译模板的时候，要对属性值中的换行符
或制表符做兼容处理。而 shouldDecodeNewlinesForHref 为 true 意味着 Vue 在编译模板
的时候，要对 a 标签的 href 属性值中的换行符或制表符做兼容处理。

```js
const shouldDecodeNewlines = tagName === 'a' && args[1] === 'href'
    ? options.shouldDecodeNewlinesForHref
    : options.shouldDecodeNewlinesconst value = args[3] || args[4] || args[5] || ''
```

最后将处理好的结果存入之前定义好的与 match.attrs 数组长度相等的 attrs 数组中：

```js
attrs[i] = {
  name: args[1], // 标签属性的属性名，如class
  value: decodeAttr(value, shouldDecodeNewlines), // 标签属性的属性值，如class对应的a
};
```

最后，如果该标签是非自闭合标签，则将标签推入栈中（关于栈这个概念后面会说到）:

```js
if (!unary) {
  stack.push({
    tag: tagName,
    lowerCasedTag: tagName.toLowerCase(),
    attrs: attrs,
  });
  lastTag = tagName;
}
```

如果该标签是自闭合标签，现在就可以调用 start 钩子函数并传入处理好的参数来创建
AST 节点了:

```js
if (options.start) {
  options.start(tagName, attrs, unary, match.start, match.end);
}
```

以上就是开始标签的解析以及调用 start 钩子函数创建元素型的 AST 节点的所有过程。

### 解析结束标签

结束标签的解析要比解析开始标签容易多了，因为它不需要解析什么属性，只需要判断剩下
的模板字符串是否符合结束标签的特征，如果是，就将结束标签名提取出来，再调用 4 个
钩子函数中的 end 函数就好了。

首先判断剩余的模板字符串是否符合结束标签的特征，如下：

```js
const ncname = '[a-zA-Z_][\\w\\-\\.]*';
const qnameCapture = `((?:${ncname}\\:)?${ncname})`;
const endTag = new RegExp(`^<\\/${qnameCapture}[^>]*>`);
const endTagMatch = html.match(endTag);

'</div>'.match(endTag); // ["</div>", "div", index: 0, input: "</div>", groups: undefined]
'<div>'.match(endTag); // null
```

上面代码中，如果模板字符串符合结束标签的特征，则会获得匹配结果数组；如果不合符，
则得到 null。

接着再调用 end 钩子函数，如下：

```js
if (endTagMatch) {
    const curIndex = index
    advance(endTagMatch[0].length)
    parseEndTag(endTagMatch[1], curIndex, index)
    continue
}
```

在上面代码中，没有直接去调用 end 函数，而是调用了 parseEndTag 函数，关于
parseEndTag 函数内部的作用我们后面会介绍到，在这里你暂时可以理解为该函数内部就是
去调用了 end 钩子函数。

### 解析文本

解析文本也比较容易，在解析模板字符串之前，我们先查找一下第一个<出现在什么位置，
如果第一个<在第一个位置，那么说明模板字符串是以其它 5 种类型开始的；如果第一个<
不在第一个位置而在模板字符串中间某个位置，那么说明模板字符串是以文本开头的，那么
从开头到第一个<出现的位置就都是文本内容了；如果在整个模板字符串里没有找到<，那说
明整个模板字符串都是文本。这就是解析思路，接下来我们对照源码来了解一下实际的解析
过程，源码如下：

```js
let textEnd = html.indexOf('<');
// '<' 在第一个位置，为其余5种类型
if (textEnd === 0) {
  // ...
}
// '<' 不在第一个位置，文本开头
if (textEnd >= 0) {
  // 如果html字符串不是以'<'开头,说明'<'前面的都是纯文本，无需处理
  // 那就把'<'以后的内容拿出来赋给rest
  rest = html.slice(textEnd);
  while (
    !endTag.test(rest) &&
    !startTagOpen.test(rest) &&
    !comment.test(rest) &&
    !conditionalComment.test(rest)
  ) {
    // < in plain text, be forgiving and treat it as text
    /**
     * 用'<'以后的内容rest去匹配endTag、startTagOpen、comment、conditionalComment
     * 如果都匹配不上，表示'<'是属于文本本身的内容
     */
    // 在'<'之后查找是否还有'<'
    next = rest.indexOf('<', 1);
    // 如果没有了，表示'<'后面也是文本
    if (next < 0) break;
    // 如果还有，表示'<'是文本中的一个字符
    textEnd += next;
    // 那就把next之后的内容截出来继续下一轮循环匹配
    rest = html.slice(textEnd);
  }
  // '<'是结束标签的开始 ,说明从开始到'<'都是文本，截取出来
  text = html.substring(0, textEnd);
  advance(textEnd);
}
// 整个模板字符串里没有找到`<`,说明整个模板字符串都是文本
if (textEnd < 0) {
  text = html;
  html = '';
}
// 把截取出来的text转化成textAST
if (options.chars && text) {
  options.chars(text);
}
```

源码的逻辑很清晰，根据<在不在第一个位置以及整个模板字符串里没有<都分别进行了处理
。

值得深究的是如果<不在第一个位置而在模板字符串中间某个位置，那么说明模板字符串是
以文本开头的，那么从开头到第一个<出现的位置就都是文本内容了，接着我们还要从第一
个<的位置继续向后判断，因为还存在这样一种情况，那就是如果文本里面本来就包含一个
<，例如 1<2</div>。为了处理这种情况，我们把从第一个<的位置直到模板字符串结束都截
取出来记作 rest，如下：

```js
let rest = html.slice(textEnd);
```

接着用 rest 去匹配以上 5 种类型的正则，如果都匹配不上，则表明这个<是属于文本本身
的内容，如下：

```js
while (
  !endTag.test(rest) &&
  !startTagOpen.test(rest) &&
  !comment.test(rest) &&
  !conditionalComment.test(rest)
) {}
```

如果都匹配不上，则表明这个<是属于文本本身的内容，接着以这个<的位置继续向后查找，
看是否还有<，如果没有了，则表示后面的都是文本；如果后面还有下一个<，那表明至少在
这个<到下一个<中间的内容都是文本，至于下一个<以后的内容是什么，则还需要重复以上
的逻辑继续判断。代码如下：

```js
while (
  !endTag.test(rest) &&
  !startTagOpen.test(rest) &&
  !comment.test(rest) &&
  !conditionalComment.test(rest)
) {
  // < in plain text, be forgiving and treat it as text
  /**
   * 用'<'以后的内容rest去匹配endTag、startTagOpen、comment、conditionalComment
   * 如果都匹配不上，表示'<'是属于文本本身的内容
   */
  // 在'<'之后查找是否还有'<'
  next = rest.indexOf('<', 1);
  // 如果没有了，表示'<'后面也是文本
  if (next < 0) break;
  // 如果还有，表示'<'是文本中的一个字符
  textEnd += next;
  // 那就把next之后的内容截出来继续下一轮循环匹配
  rest = html.slice(textEnd);
}
```

最后截取文本内容 text 并调用 4 个钩子函数中的 chars 函数创建文本型的 AST 节点。

## 保证 AST 节点层级关系

Vue 在 HTML 解析器的开头定义了一个栈 stack，这个栈的作用就是用来维护 AST 节点层
级的，那么它是怎么维护的呢？通过前文我们知道，HTML 解析器在从前向后解析模板字符
串时，每当遇到开始标签时就会调用 start 钩子函数，那么在 start 钩子函数内部我们可
以将解析得到的开始标签推入栈中，而每当遇到结束标签时就会调用 end 钩子函数，那么
我们也可以在 end 钩子函数内部将解析得到的结束标签所对应的开始标签从栈中弹出。当
解析到开始标签<div>时，就把 div 推入栈中，然后继续解析，当解析到<p>时，再把 p 推
入栈中，同理，再把 span 推入栈中，当解析到结束标签</span>时，此时栈顶的标签刚好
是 span 的开始标签，那么就用 span 的开始标签和结束标签构建 AST 节点，并且从栈中
把 span 的开始标签弹出，那么此时栈中的栈顶标签 p 就是构建好的 span 的 AST 节点的
父节点。这样我们就找到了当前被构建节点的父节点。这只是栈的一个用途，它还有另外一
个用途。按照上面的流程解析这个模板字符串时，当解析到结束标签</p>时，此时栈顶的标
签应该是 p 才对，而现在是 span，那么就说明 span 标签没有被正确闭合，此时控制台就
会抛出警告：‘tag has no matching end tag.’相信这个警告你一定不会陌生。这就是栈的
第二个用途： 检测模板字符串中是否有未正确闭合的标签。

OK，有了这个栈的概念之后，我们再回看 HTML 解析器解析不同内容的代码。

## 回归源码

### HTML 解析器源码

```js
function parseHTML(html, options) {
  var stack = [];
  var expectHTML = options.expectHTML;
  var isUnaryTag$$1 = options.isUnaryTag || no;
  var canBeLeftOpenTag$$1 = options.canBeLeftOpenTag || no;
  var index = 0;
  var last, lastTag;

  // 开启一个 while 循环，循环结束的条件是 html 为空，即 html 被 parse 完毕
  while (html) {
    last = html;
    // 确保即将 parse 的内容不是在纯文本标签里 (script,style,textarea)
    if (!lastTag || !isPlainTextElement(lastTag)) {
      let textEnd = html.indexOf('<');
      /**
       * 如果html字符串是以'<'开头,则有以下几种可能
       * 开始标签:<div>
       * 结束标签:</div>
       * 注释:<!-- 我是注释 -->
       * 条件注释:<!-- [if !IE] --> <!-- [endif] -->
       * DOCTYPE:<!DOCTYPE html>
       * 需要一一去匹配尝试
       */
      if (textEnd === 0) {
        // 解析是否是注释
        if (comment.test(html)) {
        }
        // 解析是否是条件注释
        if (conditionalComment.test(html)) {
        }
        // 解析是否是DOCTYPE
        const doctypeMatch = html.match(doctype);
        if (doctypeMatch) {
        }
        // 解析是否是结束标签
        const endTagMatch = html.match(endTag);
        if (endTagMatch) {
        }
        // 匹配是否是开始标签
        const startTagMatch = parseStartTag();
        if (startTagMatch) {
        }
      }
      // 如果html字符串不是以'<'开头,则解析文本类型
      let text, rest, next;
      if (textEnd >= 0) {
      }
      // 如果在html字符串中没有找到'<'，表示这一段html字符串都是纯文本
      if (textEnd < 0) {
        text = html;
        html = '';
      }
      // 把截取出来的text转化成textAST
      if (options.chars && text) {
        options.chars(text);
      }
    } else {
      // 父元素为script、style、textarea时，其内部的内容全部当做纯文本处理
    }

    //将整个字符串作为文本对待
    if (html === last) {
      options.chars && options.chars(html);
      if (!stack.length && options.warn) {
        options.warn('Mal-formatted tag at end of template: "' + html + '"');
      }
      break;
    }
  }

  // Clean up any remaining tags
  parseEndTag();
  //parse 开始标签
  function parseStartTag() {}
  //处理 parseStartTag 的结果
  function handleStartTag(match) {}
  //parse 结束标签
  function parseEndTag(tagName, start, end) {}
}
```

上述代码中大致可分为三部分：

- 定义的一些常量和变量
- while 循环
- 解析过程中用到的辅助函数首先定义了几个常量:

```js
const stack = []; // 维护AST节点层级的栈
const expectHTML = options.expectHTML;
const isUnaryTag = options.isUnaryTag || no;
const canBeLeftOpenTag = options.canBeLeftOpenTag || no; //用来检测一个标签是否是可以省略闭合标签的非自闭合标签
let index = 0; //解析游标，标识当前从何处开始解析模板字符串
let last, // 存储剩余还未解析的模板字符串
  lastTag; // 存储着位于 stack 栈顶的元素
```

接着开启 while 循环，循环的终止条件是 模板字符串 html 为空，即模板字符串被全部编
译完毕。在每次 while 循环中， 先把 html 的值赋给变量 last. 这样做的目的是，如果
经过上述所有处理逻辑处理过后，html 字符串没有任何变化，即表示 html 字符串没有匹
配上任何一条规则，那么就把 html 字符串当作纯文本对待，创建文本类型的 AST 节点并
且如果抛出异常：模板字符串中标签格式有误.

```js
//将整个字符串作为文本对待
if (html === last) {
    options.chars && options.chars(html);
    if (!stack.length && options.warn) {
        options.warn(("Mal-formatted tag at end of template: \"" + html + "\""));
    }
    break
}
```

接着，我们继续看 while 循环体内的代码：

```js
while (html) {
  // 确保即将 parse 的内容不是在纯文本标签里 (script,style,textarea)
  if (!lastTag || !isPlainTextElement(lastTag)) {
  } else {
    // parse 的内容是在纯文本标签里 (script,style,textarea)
  }
}
```

在循环体内，首先判断了待解析的 html 字符串是否在纯文本标签里，如
script,style,textarea，因为在这三个标签里的内容肯定不会有 HTML 标签，所以我们可
直接当作文本处理,前面我们说了，lastTag 为栈顶元素，!lastTag 即表示当前 html 字符
串没有父节点，而 isPlainTextElement(lastTag) 是检测 lastTag 是否为是那三个纯文本
标签之一，是的话返回 true，不是返回 fasle。

也就是说当前 html 字符串要么没有父节点要么父节点不是纯文本标签，则接下来就可以依
次解析那 6 种类型的内容了，关于 6 种类型内容的处理方式前文已经逐个介绍过，此处不
再重复。

### parseEndTag 函数源码

```js
function parseEndTag (tagName, start, end) {
    let pos, lowerCasedTagName
    if (start == null) start = index
    if (end == null) end = index

    if (tagName) {
      lowerCasedTagName = tagName.toLowerCase()
    }

    // Find the closest opened tag of the same type
    if (tagName) {
      for (pos = stack.length - 1; pos >= 0; pos--) {
        if (stack[pos].lowerCasedTag === lowerCasedTagName) {
          break
        }
      }
    } else {
      // If no tag name is provided, clean shop
      pos = 0
    }

    if (pos >= 0) {
      // Close all the open elements, up the stack
      for (let i = stack.length - 1; i >= pos; i--) {
        if (process.env.NODE_ENV !== 'production' &&
          (i > pos || !tagName) &&
          options.warn
        ) {
          options.warn(
            `tag <${stack[i].tag}> has no matching end tag.`
          )
        }
        if (options.end) {
          options.end(stack[i].tag, start, end)
        }
      }

      // Remove the open elements from the stack
      stack.length = pos
      lastTag = pos && stack[pos - 1].tag
    } else if (lowerCasedTagName === 'br') {
      if (options.start) {
        options.start(tagName, [], true, start, end)
      }
    } else if (lowerCasedTagName === 'p') {
      if (options.start) {
        options.start(tagName, [], false, start, end)
      }
      if (options.end) {
        options.end(tagName, start, end)
      }
    }
  }
}
```

该函数接收三个参数，分别是结束标签名 tagName、结束标签在 html 字符串中的起始和结
束位置 start 和 end。

这三个参数其实都是可选的，根据传参的不同其功能也不同。

- 第一种是三个参数都传递，用于处理普通的结束标签
- 第二种是只传递 tagName
- 第三种是三个参数都不传递，用于处理栈中剩余未处理的标签如果 tagName 存在，那
  么就从后往前遍历栈，在栈中寻找与 tagName 相同的标签并记录其所在的位置 pos，
  如果 tagName 不存在，则将 pos 置为 0。

```js
if (tagName) {
  for (pos = stack.length - 1; pos >= 0; pos--) {
    if (stack[pos].lowerCasedTag === lowerCasedTagName) {
      break;
    }
  }
} else {
  // If no tag name is provided, clean shop
  pos = 0;
}
```

接着当 pos>=0 时，开启一个 for 循环，从栈顶位置从后向前遍历直到 pos 处，如果发现
stack 栈中存在索引大于 pos 的元素，那么该元素一定是缺少闭合标签的。这是因为在正
常情况下，stack 栈的栈顶元素应该和当前的结束标签 tagName 匹配，也就是说正常的
pos 应该是栈顶位置，后面不应该再有元素，如果后面还有元素，那么后面的元素就都缺少
闭合标签 那么这个时候如果是在非生产环境会抛出警告，告诉你缺少闭合标签。除此之外
，还会调用 options.end(stack[i].tag, start, end)立即将其闭合，这是为了保证解析结
果的正确性。

```js
if (pos >= 0) {
  // Close all the open elements, up the stack
  for (var i = stack.length - 1; i >= pos; i--) {
    if (i > pos || !tagName) {
      options.warn('tag <' + stack[i].tag + '> has no matching end tag.');
    }
    if (options.end) {
      options.end(stack[i].tag, start, end);
    }
  }

  // Remove the open elements from the stack
  stack.length = pos;
  lastTag = pos && stack[pos - 1].tag;
}
```

最后把 pos 位置以后的元素都从 stack 栈中弹出，以及把 lastTag 更新为栈顶元素:

```js
stack.length = pos;
lastTag = pos && stack[pos - 1].tag;
```

接着，如果 pos 没有大于等于 0，即当 tagName 没有在 stack 栈中找到对应的开始标签
时，pos 为 -1 。那么此时再判断 tagName 是否为 br 或 p 标签，为什么要单独判断这两
个标签呢？这是因为在浏览器中如果我们写了如下 HTML：

```html
<div>
    </br>
    </p>
</div>
```

浏览器会自动把</br>标签解析为正常的 <br>标签，而对于</p>浏览器则自动将其补全
为<p></p>，所以 Vue 为了与浏览器对这两个标签的行为保持一致，故对这两个便签单独判
断处理，如下：

```js
if (lowerCasedTagName === 'br') {
  if (options.start) {
    options.start(tagName, [], true, start, end); // 创建<br>AST节点
  }
}
// 补全p标签并创建AST节点
if (lowerCasedTagName === 'p') {
  if (options.start) {
    options.start(tagName, [], false, start, end);
  }
  if (options.end) {
    options.end(tagName, start, end);
  }
}
```

以上就是对结束标签的解析与处理. 另外，在 while 循环后面还有一行代码：

```js
parseEndTag();
```

这行代码执行的时机是 html === last，即 html 字符串中的标签格式有误时会跳出 while
循环，此时就会执行这行代码，这行代码是调用 parseEndTag 函数并不传递任何参数，前
面我们说过如果 parseEndTag 函数不传递任何参数是用于处理栈中剩余未处理的标签。这
是因为如果不传递任何函数，此时 parseEndTag 函数里的 pos 就为 0，那么 pos>=0 就会
恒成立，那么就会逐个警告缺少闭合标签，并调用 options.end 将其闭合。
