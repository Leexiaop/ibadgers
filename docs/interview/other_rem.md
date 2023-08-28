---
title: 移动端自适应方案
group: 其他
toc: content
---

## 方案一：js 控制

- 首先设置 html 或者是 body 的字体大小，设置好后，内部元素的 1rem 值会被这个值
  改变。
- font-size="设备宽度/设计稿宽度"，将这个值作为 1rem 的 px 的个数，像素不能太
  小，就乘以 100
- 那么设计稿中元素为 25px 值时候，在设备上就是 25rem,然后在除以 100，就是
  0.25rem

```js
<script>
	(function (doc, win) {
		var docEl = doc.documentElement || doc.body,
			resizeEvt = 'orientationchange' in window ? 'orientationchange' : 'resize',
			recalc = function () {
				var clientWidth = docEl.clientWidth;
				if (!clientWidth) return;
				docEl.style.fontSize = 100 * (clientWidth / 375) + 'px';
			}
		if (!doc.addEventListener) return;
		win.addEventListener(resizeEvt, recalc, false);
		doc.addEventListener('DOMContentLoaded', recalc, false);
	})(document, window);
</script>
```

## 方案二：lib-flexible + px2rem-loader

```js
(function (win, lib) {
  var doc = win.document;
  var docEl = doc.documentElement;
  var metaEl = doc.querySelector('meta[name="viewport"]');
  var flexibleEl = doc.querySelector('meta[name="flexible"]');
  var dpr = 0;
  var scale = 0;
  var tid;
  var flexible = lib.flexible || (lib.flexible = {});

  if (metaEl) {
    console.warn('将根据已有的meta标签来设置缩放比例');
    var match = metaEl
      .getAttribute('content')
      .match(/initial\-scale=([\d\.]+)/);
    if (match) {
      scale = parseFloat(match[1]);
      dpr = parseInt(1 / scale);
    }
  } else if (flexibleEl) {
    var content = flexibleEl.getAttribute('content');
    if (content) {
      var initialDpr = content.match(/initial\-dpr=([\d\.]+)/);
      var maximumDpr = content.match(/maximum\-dpr=([\d\.]+)/);
      if (initialDpr) {
        dpr = parseFloat(initialDpr[1]);
        scale = parseFloat((1 / dpr).toFixed(2));
      }
      if (maximumDpr) {
        dpr = parseFloat(maximumDpr[1]);
        scale = parseFloat((1 / dpr).toFixed(2));
      }
    }
  }
  if (!dpr && !scale) {
    var isAndroid = win.navigator.appVersion.match(/android/gi);
    var isIPhone = win.navigator.appVersion.match(/iphone/gi);
    var devicePixelRatio = win.devicePixelRatio;
    if (isIPhone) {
      // iOS下，对于2和3的屏，用2倍的方案，其余的用1倍方案
      if (devicePixelRatio >= 3 && (!dpr || dpr >= 3)) {
        dpr = 3;
      } else if (devicePixelRatio >= 2 && (!dpr || dpr >= 2)) {
        dpr = 2;
      } else {
        dpr = 1;
      }
    } else {
      // 其他设备下，仍旧使用1倍的方案
      dpr = 1;
    }
    scale = 1 / dpr;
  }

  docEl.setAttribute('data-dpr', dpr);
  if (!metaEl) {
    metaEl = doc.createElement('meta');
    metaEl.setAttribute('name', 'viewport');
    metaEl.setAttribute(
      'content',
      'initial-scale=' +
        scale +
        ', maximum-scale=' +
        scale +
        ', minimum-scale=' +
        scale +
        ', user-scalable=no',
    );
    if (docEl.firstElementChild) {
      docEl.firstElementChild.appendChild(metaEl);
    } else {
      var wrap = doc.createElement('div');
      wrap.appendChild(metaEl);
      doc.write(wrap.innerHTML);
    }
  }

  function refreshRem() {
    var width = docEl.getBoundingClientRect().width;
    if (width / dpr > 540) {
      width = 540 * dpr;
    }
    var rem = width / 10;
    docEl.style.fontSize = rem + 'px';
    flexible.rem = win.rem = rem;
  }

  win.addEventListener(
    'resize',
    function () {
      clearTimeout(tid);
      tid = setTimeout(refreshRem, 300);
    },
    false,
  );
  win.addEventListener(
    'pageshow',
    function (e) {
      if (e.persisted) {
        clearTimeout(tid);
        tid = setTimeout(refreshRem, 300);
      }
    },
    false,
  );

  if (doc.readyState === 'complete') {
    doc.body.style.fontSize = 12 * dpr + 'px';
  } else {
    doc.addEventListener(
      'DOMContentLoaded',
      function (e) {
        doc.body.style.fontSize = 12 * dpr + 'px';
      },
      false,
    );
  }

  refreshRem();

  flexible.dpr = win.dpr = dpr;
  flexible.refreshRem = refreshRem;
  flexible.rem2px = function (d) {
    var val = parseFloat(d) * this.rem;
    if (typeof d === 'string' && d.match(/rem$/)) {
      val += 'px';
    }
    return val;
  };
  flexible.px2rem = function (d) {
    var val = parseFloat(d) / this.rem;
    if (typeof d === 'string' && d.match(/px$/)) {
      val += 'rem';
    }
    return val;
  };
})(window, window['lib'] || (window['lib'] = {}));
```

主要思想还是使用 rem 单位，根据屏幕大小的变化，动态改变根字体的大小，并且识别设
备的 dpr，动态配置出适合当前环境的 viewport 配置。我们项目的 head 中一般都会有：

```html
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
```

所以源码中，flexible 会首先判断有没有上面这行代码，如果有 flexible 将会根据我们
meta 标签内的配置，对 dpr 和 scale 赋值。否则自己对 dpr 和 scale 赋值，但是这一
段代码基本不会执行。代码执行至此，dpr 和 scale 都已经有了值，首先，flexible 会在
html 标签上创建“data-dpr”来标识当前设备的 dpr，其次，如果到了这里还没有 meta 标
签的配置，flexible 会帮我们自动创建 meta 标签。

接下来的 refreshRem 方法将是 flexible 的核心功能。在项目初次运行、页面展示、页面
大小改变的时候都会执行 refreshRem()方法。这个方法中有很多有趣的设置。这个方法中
，主要就是获取设备屏幕的宽度，然后将其平分为 10 份，计算出每一份的大小。这里对
body 的操作，要清楚 flexible 使用的方法，它建议我们各类组件和容器的宽高布局使用
rem 单位，而对于字体使用 px，这下就明白了，body 中的 fontsize 是用来控制字体大小
了，而不会影响 rem 的使用。flexible 不希望字体的大小自适应变化，可能会影响美观，
或者考虑到浏览器对最小字号的规定不统一。当然，在 flexible 中字体使用 rem 也是可
以的。

flexible 需要搭配 ostcss-px2rem 使用，主要是将 px 转化为 rem;
