---
title: 模版编译篇
order: 8
group: vue2
toc: content
---

## 模版编译篇

`模版:`模版就是，我们在开发中写在< template ></ template>标签之间的内容就是 vue
的模版，它是一个类似于原生 html 的内容，是无法被浏览器直接解析的。那么就需要编译
。

`模版编译:`就是把< template ></ template>标签中类似于原生 html 的内容转化成浏览
器解析的 html，并且将 vue 指令等解析分离出来。经过一系列的操作生成渲染函数的过程
就是模版编译。

## 编译流程

对于 vue 来说 template 标签中的内容就是个字符串，所以需要三步，就可以将这些字符
串解析出来：

- 模版解析阶段----解析器
- 优化阶段---优化器
- 代码生成阶段---代码生成器

```js
// 源码位置: /src/complier/index.js

export const createCompiler = createCompilerCreator(function baseCompile(
  template: string,
  options: CompilerOptions,
): CompiledResult {
  // 模板解析阶段：用正则等方式解析 template 模板中的指令、class、style等数据，形成AST
  const ast = parse(template.trim(), options);
  if (options.optimize !== false) {
    // 优化阶段：遍历AST，找出其中的静态节点，并打上标记；
    optimize(ast, options);
  }
  // 代码生成阶段：将AST转换成渲染函数；
  const code = generate(ast, options);
  return {
    ast,
    render: code.render,
    staticRenderFns: code.staticRenderFns,
  };
});
```

```js
// 代码位置：/src/complier/parser/index.js

/**
 * Convert HTML string to AST.
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
    start(tag, attrs, unary) {},
    end() {},
    chars(text: string) {},
    comment(text: string) {},
  });
  return root;
}
```

可以看到 baseCompile 的代码非常的简短主要核心代码。

- const ast =parse(template.trim(), options):parse 会用正则等方式解析 template
  模板中的指令、class、style 等数据，形成 AST。
- optimize(ast, options): optimize 的主要作用是标记静态节点，这是 Vue 在编译过
  程中的一处优化，挡在进行 patch 的过程中， DOM-Diff 算法会直接跳过静态节点，
  从而减少了比较的过程，优化了 patch 的性能。
- const code =generate(ast, options): 将 AST 转化成 render 函数字符串的过程，
  得到结果是 render 函数 的字符串以及 staticRenderFns 字符串。

```js
{
 	ast: ast,
 	render: code.render,
 	staticRenderFns: code.staticRenderFns
}
```

最终返回了抽象语法树( ast )，渲染函数( render )，静态渲染函数( staticRenderFns
)，且 render 的值为 code.render，staticRenderFns 的值为 code.staticRenderFns，也
就是说通过 generate 处理 ast 之后得到的返回值 code 是一个对象。

模版编译的大致流程图：

![模版编译](https://leexiaop.github.io/static/ibadgers/code/vue2/template_compliar.png)
