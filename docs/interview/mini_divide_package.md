---
title: 微信小程序如何实现分包配置
group: 小程序
toc: content
---

## 分包是什么

分包指的是把一个完整的小程序项目，按照需求划分为不同的子包，在构建时打包成不同的
分包，用户在使用时按需进行加载。

`分包原理`：在小程序启动时，默认会下载主包并启动主包内页面，当用户进入分包内某个
页面时，客户端会把对应分包下载下来，下载完成后再进行展示。

## 分包的构成

小程序的分包一般是由于一个主包和多个分包组成：主包：一般只包含小程序的启动页，和
tab 页面，以及分包用到的一些公共资源分包：只包含和当前分包有关的页面和私有资源

![小程序分包](http://leexiaop.github.io/static/ibadgers/interview/mini_bag.png)

## 为什么需要分包

微信小程序限制了代码包不能超过 2MB，限制大小是对小程序启动速度的考虑，但是 2MB
大小严重限制了小程序功能的扩展，业务需求可能需要更大的体积，综合考虑微信推出了“
分包加载方案”。目前小程序分包大小有以下限制：

- 整个小程序所有分包大小不超过 20M（微信小程序版本不同，大小不同）
- 单个分包/主包大小不能超过 2M
- 对小程序进行分包，可以优化小程序首次启动的下载时间，以及在多团队共同开发时可
  以更好的解耦协作

## 分包配置

假设支持分包的小程序目录结构如下：

```md
├── app.js ├── app.json ├── app.wxss ├── packageA │ └── pages │ ├── cat │ └──
dog ├── packageB │ └── pages │ ├── apple │ └── banana ├── pages │ ├── index │
└── logs └── utils
```

app.json 中的配置：

```js
{
  "pages":[
    "pages/index",
    "pages/logs"
  ],
  "subpackages": [
    {
      "root": "packageA",
      "pages": [
        "pages/cat",
        "pages/dog"
      ]
    }, {
      "root": "packageB",
      "name": "pack2",
      "pages": [
        "pages/apple",
        "pages/banana"
      ]
    }
  ]
}
```

打包原则

- 声明 subpackages 后，将按 subpackages 配置路径进行打包，subpackages 配置路径
  外的目录将被打包到主包中
- 主包也可以有自己的 pages，即最外层的 pages 字段。 subpackage 的根目录不能是
  另外一个 subpackage 内的子目录
- tabBar 页面必须在主包内引用原则
- packageA 无法 require packageB JS 文件，但可以 require 主包、packageA 内的
  JS 文件；使用 分包异步化 时不受此条限制
- packageA 无法 import packageB 的 template，但可以 require 主包、packageA 内
  的 template
- packageA 无法使用 packageB 的资源，但可以使用主包、packageA 内的资源

## 独立分包

独立分包是小程序中一种特殊类型的分包，可以独立于主包和其他分包运行。从独立分包中
页面进入小程序时，不需要下载主包。当用户进入普通分包或主包内页面时，主包才会被下
载。

开发者可以按需将某些具有一定功能独立性的页面配置到独立分包中。当小程序从普通的分
包页面启动时，需要首先下载主包；而独立分包不依赖主包即可运行，可以很大程度上提升
分包页面的启动速度。

一个小程序中可以有多个独立分包。假设小程序目录结构如下：

```md
├── app.js ├── app.json ├── app.wxss ├── moduleA │ └── pages │ ├── rabbit │ └──
squirrel ├── moduleB │ └── pages │ ├── pear │ └── pineapple ├── pages │ ├──
index │ └── logs └── utils
```

通过在 app.json 的 subpackages 字段中对应的分包配置项中定义 independent 字段声明
对应分包为独立分包。

```js
{
  "pages": [
    "pages/index",
    "pages/logs"
  ],
  "subpackages": [
    {
      "root": "moduleA",
      "pages": [
        "pages/rabbit",
        "pages/squirrel"
      ]
    }, {
      "root": "moduleB",
      "pages": [
        "pages/pear",
        "pages/pineapple"
      ],
      "independent": true
    }
  ]
}
```

那么 moduleB 是一个独立分包

限制

独立分包属于分包的一种。普通分包的所有限制都对独立分包有效。独立分包中插件、自定
义组件的处理方式同普通分包。

此外，使用独立分包时要注意：

- 独立分包中不能依赖主包和其他分包中的内容，包括 js 文件、template、wxss、自定
  义组件、插件等（使用 分包异步化 时 js 文件、自定义组件、插件不受此条限制）
- 主包中的 app.wxss 对独立分包无效，应避免在独立分包页面中使用 app.wxss 中的样
  式；
- App 只能在主包内定义，独立分包中不能定义 App，会造成无法预期的行为；
- 独立分包中暂时不支持使用插件。注意事项

（1）关于 getApp() 与普通分包不同，独立分包运行时，App 并不一定被注册，因此
getApp() 也不一定可以获得 App 对象：

- 当用户从独立分包页面启动小程序时，主包不存在，App 也不存在，此时调用
  getApp() 获取到的是 undefined。 当用户进入普通分包或主包内页面时，主包才会被
  下载，App 才会被注册。
- 当用户是从普通分包或主包内页面跳转到独立分包页面时，主包已经存在，此时调用
  getApp() 可以获取到真正的 App。由于这一限制，开发者无法通过 App 对象实现独立
  分包和小程序其他部分的全局变量共享。

为了在独立分包中满足这一需求，基础库 2.2.4 版本开始 getApp 支持 [allowDefault]
参数，在 App 未定义时返回一个默认实现。当主包加载，App 被注册时，默认实现中定义
的属性会被覆盖合并到真正的 App 中。

（2）关于 App 生命周期当从独立分包启动小程序时，主包中 App 的 onLaunch 和首次
onShow 会在从独立分包页面首次进入主包或其他普通分包页面时调用。

由于独立分包中无法定义 App，小程序生命周期的监听可以使用
wx.onAppShow，wx.onAppHide 完成。App 上的其他事件可以使用
wx.onError，wx.onPageNotFound 监听。

## 分包预备加载

可以通过配置，在进入小程序某个页面时，由框架自动预下载可能需要的分包，提升进入后
续分包页面时的启动速度。对于独立分包，也可以预下载主包。预下载分包行为在进入某个
页面时触发，通过在 app.json 增加 preloadRule 配置来控制。

```js
{
  "pages": ["pages/index"],
  "subpackages": [
    {
      "root": "important",
      "pages": ["index"],
    },
    {
      "root": "sub1",
      "pages": ["index"],
    },
    {
      "name": "hello",
      "root": "path/to",
      "pages": ["index"]
    },
    {
      "root": "sub3",
      "pages": ["index"]
    },
    {
      "root": "indep",
      "pages": ["index"],
      "independent": true
    }
  ],
  "preloadRule": {
    "pages/index": {
      "network": "all",
      "packages": ["important"]
    },
    "sub1/index": {
      "packages": ["hello", "sub3"]
    },
    "sub3/index": {
      "packages": ["path/to"]
    },
    "indep/index": {
      "packages": ["__APP__"]
    }
  }
}
```

preloadRule 中，key 是页面路径，value 是进入此页面的预下载配置，每个配置有以下几
项：

- packages:进入页面后预下载分包的 root 或 name。**APP** 表示主包。
- network:在指定网络下预下载，可选值为：all: 不限网络,wifi: 仅 wifi 下预下载限
  制

同一个分包中的页面享有共同的预下载大小限额 2M，限额会在工具中打包时校验。

如，页面 A 和 B 都在同一个分包中，A 中预下载总大小 0.5M 的分包，B 中最多只能预下
载总大小 1.5M 的分包。

## 分包异步化

在小程序中，不同的分包对应不同的下载单元；因此，除了非独立分包可以依赖主包外，分
包之间不能互相使用自定义组件或进行 require。「分包异步化」特性将允许通过一些配置
和新的接口，使部分跨分包的内容可以等待下载后异步使用，从而一定程度上解决这个限制
。跨分包自定义组件引用: 一个分包使用其他分包的自定义组件时，由于其他分包还未下载
或注入，其他分包的组件处于不可用的状态。通过为其他分包的自定义组件设置 占位组件
，我们可以先渲染占位组件作为替代，在分包下载完成后再进行替换。例如：

```json
// subPackageA/pages/index.json
{
  "usingComponents": {
    "button": "../../commonPackage/components/button",
    "list": "../../subPackageB/components/full-list",
    "simple-list": "../components/simple-list"
  },
  "componentPlaceholder": {
    "button": "view",
    "list": "simple-list"
  }
}
```

在这个配置中，button 和 list 两个自定义组件是跨分包引用组件，其中 button 在渲染
时会使用内置组件 view 作为替代，list 会使用当前分包内的自定义组件 simple-list 作
为替代进行渲染；在这两个分包下载完成后，占位组件就会被替换为对应的跨分包组件。

在基础库 2.24.3 之后，可以使用 wx.onLazyLoadError 监听加载事件。

跨分包 JS 代码引用:

一个分包中的代码引用其它分包的代码时，为了不让下载阻塞代码运行，我们需要异步获取
引用的结果。如：

```js
// subPackageA/index.js
// 使用回调函数风格的调用
require('../subPackageB/utils.js', (utils) => {
  console.log(utils.whoami); // Wechat MiniProgram
}, ({ mod, errMsg }) => {
  console.error(`path: ${mod}, ${errMsg}`);
});
// 或者使用 Promise 风格的调用
require
  .async('../commonPackage/index.js')
  .then((pkg) => {
    pkg.getPackageName(); // 'common'
  })
  .catch(({ mod, errMsg }) => {
    console.error(`path: ${mod}, ${errMsg}`);
  });
```

在其它分包中的插件也可以通过类似的方法调用：

```js
// 使用回调函数风格的调用
requirePlugin(
  'live-player-plugin',
  (livePlayer) => {
    console.log(livePlayer.getPluginVersion());
  },
  ({ mod, errMsg }) => {
    console.error(`path: ${mod}, ${errMsg}`);
  },
);
// 或者使用 Promise 风格的调用
requirePlugin
  .async('live-player-plugin')
  .then((livePlayer) => {
    console.log(livePlayer.getPluginVersion());
  })
  .catch(({ mod, errMsg }) => {
    console.error(`path: ${mod}, ${errMsg}`);
  });
```
