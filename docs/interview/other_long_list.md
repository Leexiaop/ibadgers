---
title: 移动端长列表优化
group: 其他
toc: content
---

移动端长列表的优化是指，在移动设备，某一个网页渲染了一个超长列表，假设有 10000+
条数据，那么在上下滑动的时候，就会出现卡顿的情况，那么如何解决这种情况，就是所谓
的长列表优化。

那么针对这种情况，我们的方案就是利用虚拟列表实现，当然，你也可以通过分页，上拉和
下拉刷新来实现，但这不是我们要讨论的范围。

## 什么是虚拟列表

虚拟列表其实是按需显示的一种实现，即只对可见区域进行渲染，对非可见区域中的数据不
渲染或部分渲染的技术，从而达到极高的渲染性能。假设有 10 万条记录需要同时渲染，我
们屏幕的可见区域的高度为 550px,而列表项的高度为 55px，则此时我们在屏幕中最多只能
看到 10 个列表项，那么在渲染的时候，我们只需加载可视区的那 10 条即可。

## 为什么需要

虚拟列表可以解决一次性渲染数据量过大时，页面卡顿，(比如: table 不分页并且一次性
加载上万条复杂的数据)

## 实现原理

![虚拟列表](https://leexiaop.github.io/static/ibadgers/interview/other_verticl_list.png)

`实现步骤：`

- 实现一个代表可视区域的 div class="content_box",我们一般将这个 div 的宽度设置
  为设备可视区域的高度(document.documentElement.clientHeight),当然你写固定的
  300px，500px 也没有问题，依具体需求即可，然后通过 overflow: auto 来实现超出
  部分可以滚动。
- 计算区域中可以显示的数据条数。这个用可视区域的高度除以单条数据高度得到。比如
  列表中获取可视区域的高度为 100，而每条 item 的高度为 25,那么也就是说，整个虚
  拟列表，我们将会渲染 4 条数据。这个很重要。
- 监听滚动，当滚动条变化时，计算出被卷起的数据的高度。所谓卷起的高度，就是上图
  中上滚动区域的内容区域，可以通过
  document.querySelector('.content_box').scrollTop 来获取。
- 计算区域内数据的起始索引，也就是区域内的第一条数据：这个用卷起的高度除以单条
  数据高度可以拿到。
- 计算区域内数据的结束索引。通过起始索引+可显示的数据的条数可以拿到。
- 取起始索引和结束索引中间的数据，渲染到可视区域。
- 计算起始索引对应的数据在整个列表中的偏移位置并设置到列表上。

最终的效果是：不论怎么滚动，我们改变的只是滚动条的高度和可视区的元素内容。每次只
会渲染一个固定的条数，不会增加多余元素。下面是 vue 实现的方式 Demo：

```html
<template>
  <div
    :style="{height: `${contentHeight}px`}"
    class="content_box"
    @scroll="scroll"
  >
    <!--这层div是为了把高度撑开，让滚动条出现，height值为所有数据总高-->
    <div
      :style="{'height': `${itemHeight*(listAll.length)}px`, 'position': 'relative'}"
    >
      <!--可视区域里所有数据的渲染区域-->
      <div :style="{'position': 'absolute', 'top': `${top}px`}">
        <!--单条数据渲染区域-->
        <div v-for="(item,index) in showList" :key="index" class="item">
          {{item}}
        </div>
      </div>
    </div>
  </div>
</template>
<script>
  export default {
    name: 'list',
    data() {
      return {
        listAll: [], //所有数据
        showList: [], //可视区域显示的数据
        contentHeight: document.documentElement.clientHeight, //可视区域高度
        itemHeight: 30, //每条数据所占高度
        showNum: 0, //可是区域显示的最大条数
        top: 0, //偏移量
        scrollTop: 0, //卷起的高度
        startIndex: 0, //可视区域第一条数据的索引
        endIndex: 0, //可视区域最后一条数据后面那条数据的的索引，因为后面要用slice(start,end)方法取需要的数据，但是slice规定end对应数据不包含在里面
      };
    },
    methods: {
      //构造10万条数据
      getList() {
        for (let i = 0; i < 100000; i++) {
          this.listAll.push(`我是第${i}条数据呀`);
        }
      },
      //计算可视区域数据
      getShowList() {
        //可视区域最多出现的数据条数，值是小数的话往上取整，因为极端情况是第一条和最后一条都只显示一部分
        this.showNum = Math.ceil(this.contentHeight / this.itemHeight);
        //可视区域第一条数据的索引
        this.startIndex = Math.floor(this.scrollTop / this.itemHeight);
        //可视区域最后一条数据的后面那条数据的索引
        this.endIndex = this.startIndex + this.showNum;
        //可视区域显示的数据，即最后要渲染的数据。实际的数据索引是从this.startIndex到this.endIndex-1
        this.showList = this.listAll.slice(this.startIndex, this.endIndex);
        //在这需要获得一个可以被itemHeight整除的数来作为item的偏移量，这样随机滑动时第一条数据都是完整显示的
        const offsetY = this.scrollTop - (this.scrollTop % this.itemHeight);
        this.top = offsetY;
      },
      //监听滚动事件，实时计算scrollTop
      scroll() {
        this.scrollTop = document.querySelector('.content_box').scrollTop; //element.scrollTop方法可以获取到卷起的高度
        this.getShowList();
      },
    },
    mounted() {
      this.getList();
      this.scroll();
    },
  };
</script>
<style scoped>
  .content_box {
    overflow: auto; /*只有这行代码写了，内容超出高度才会出现滚动条*/
  }
  /*每条数据的样式*/
  .item {
    box-sizing: border-box;
    height: 30px;
    padding: 5px;
    color: #666;
  }
</style>
```
