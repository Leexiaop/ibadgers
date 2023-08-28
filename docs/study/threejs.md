---
title: Threejs总览
order: 1
group: threejs
toc: content
---

其实，很早就接触过 threejs,记得那是在做一个 H5 页面的粒子背景效果，也只是从某个
网站上复制了一段代码，然后发现运 行后手机开始发烫所以放弃了。

再此接触 three 已经是过了很多年的现在，在某度厂做高精地图。也开始全面了解
threejs.到现在互联网极度不景气，而在找工作的过程中发现 threejs 开发人员没有前端
要求的高，所以，就在考虑是不是可以学习一下 threejs,作为前端方向的一个延伸，未来
也能过度到这方面的工作，比较也都是写 JavaScript，本是同根生嘛。。。

到现在为止，也还没有找到学学习 threejs 更好的方法。如果按照小白先看官网，先了解
最简单的场景，相机等，势必会很慢。所以，我的方法就是敲官网的例子，我相信他能覆盖
到所有的 case,而在敲案例的过程中去了解、熟悉 threejs 的各种 api,应该是个比较好的
选择，也避免了眼高手低的坏习惯。

let's go!

### 准备工作

因为 threejs 官网打开比较慢，所以我们还是先从 github 上将 threejs 的项目拉取到本
地，在本地运行，那么未来想要查阅文档，或者查看案例就会快很多:

#### git clone threejs 项目

https://github.com/mrdoob/three.js

#### 安装依赖

通过`yarn 或者是 npm install` 安装依赖

#### 启动

通过`npm start`启动项目，就可以查看和 threejs 官网一模一样的文档了。

### 准备抄官网的 case

#### 下载 vscode

不管你在之前的开发中，用什么样的编辑器，我都建议你下载并使用 vscode,这是一款开发
神器。不得不信。

#### 安装插件 live-server

live-server 能够让你本地的 html 文件在浏览器中快速预览，只需要，在你要预览的文件
中右键-->Open with live Server 就 ok 了。当然你也可以使用其他的服务器，比如
node，但是完全没有必要。

### threejs 准备工作

下载了官方文档，和编辑器，那么就要真正的开始自己的项目了。就是如何引入 threejs。

#### 项目的开发环境引入 threejs

你可以通过 vue 或者是 react 等，任意当前流行的前端框架来搭建一个 threejs 的项目
，而你要做的只是安装一下 threejs 这个库就可以了。

```js
npm install three
//  或者
yarn add three
```

在项目中引入：

```js
import * as THREE from 'three';
```

这样就可以在你搭建的 vue 或者是 react 项目中使用 threejs 了。当然 threejs 只是核
心库，我们在开发的过程中还会用到一些其他的扩展库，被存放在 three/examples/jsm 下
。当你使用的时候直接引入即可。

```js
// 引入扩展库OrbitControls.js
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
// 引入扩展库GLTFLoader.js
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
```

```js
// 扩展库引入——旧版本，比如122, 新版本路径addons替换了examples/jsm
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
```

#### .html 文件中直接引入 threejs

如果不是正式开发 Web3D 项目，只是学习 threejs 功能，完全没必要用 webpack 或 vite
搭建一个开发环境。学习使用的环境，只要创建一个.html 文件，编写 threejs 代码，最
后通过本地静态服务打开.html 文件就行。

##### script 标签方式引入 three.js

你可以像平时开发 web 前端项目一样，通过 script 标签把 three.js 当做一个 js 库引
入你的项目。three.js 库可以在 threejs 官方文件包下面的 build 目录获取到。

```html
<script src="./build/three.js"></script>
```

```js
//随便输入一个API，测试下是否已经正常引入three.js
console.log(THREE.Scene);
```

##### ES6 import 方式引入

给 script 标签设置 type="module",也可以在.html 文件中使用 import 方式引入
three.js。

```html
<script type="module">
  // 现在浏览器支持ES6语法，自然包括import方式引入js文件
  import * as THREE from './build/three.module.js';
</script>
```

##### type="importmap"配置路径

.html 文件引入 three.js，最好的方式就是参考 threejs 官方案例，通过配置<script
type="importmap"\>,实现学习环境.html 文件和 vue 或 reaact 脚手架开发环境一样的写
法。这样你实际项目的开发环境复制课程源码，不用改变 threejs 引入代码。

下面配置的 type="importmap"代码具体写法不用掌握记忆，复制粘贴后，能修改目录就行
，你可以去电子书课件或者课件源码中复制。

```html
<!-- 具体路径配置，你根据自己文件目录设置，我的是课件中源码形式 -->
<script type="importmap">
  {
    "imports": {
      "three": "../../../three.js/build/three.module.js"
    }
  }
</script>
```

```html
<!-- 配置type="importmap",.html文件也能和项目开发环境一样方式引入threejs -->
<script type="module">
  import * as THREE from 'three';
  // 浏览器控制台测试，是否引入成功
  console.log(THREE.Scene);
</script>
```

##### type="importmap"配置——扩展库引入

通过配置<script type="importmap"\>，让学习环境.html 文件，也能和 vue 或 react 开
发环境中一样方式方式引入 threejs 扩展库。

配置 addons/等价于 examples/jsm/。

```html
<script type="importmap">
  {
    "imports": {
      "three": "./three.js/build/three.module.js",
      "three/addons/": "./three.js/examples/jsm/"
    }
  }
</script>
```

```html
<script type="module">
  // three/addons/路径之后对应的是three.js官方文件包`/examples/jsm/`中的js库
  // 扩展库OrbitControls.js
  import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
  // 扩展库GLTFLoader.js
  import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
  console.log(OrbitControls);
  console.log(GLTFLoader);
</script>
```

准备工作基本就绪，接下来，就是实际开发了。
