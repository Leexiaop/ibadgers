---
title: webgl animation keyframes
order: 2
group: threejs
toc: content
---

我已经完成了第一个案例
，[webgl animation keyframes](https://threejs.org/examples/#webgl_animation_keyframes),
当完成这个案例后，也学习了 threejs 开发的基本构成，在这个案例中体现的淋漓尽致。

通过案例 webgl animation keyframes，我们知道了绘制三维图像的关键要素：

- 场景 Scene
- 相机 Camera
- 渲染器 renderer

### 场景 Scene

场景的创建，我们可以调佣 threejs 的 Scene 构造函数来创建一个场景。

```js
//  创建场景
const scene = new THREE.Scene();
```

创建好场景，我们还可以给场景添加相应的属性，比如背景 background,环境贴图
environment，等
。[详细的 scene 的配置请查看文档](https://threejs.org/docs/index.html#api/zh/scenes/Scene)

### 相机 Camera

和场景一样，我们同样可以通过 threejs 的 Camera 构造函数来创建一个相机。

```js
//  透视相机
const camera = new THREE.PerspectiveCamera(
  75,
  window.innerWidth / window.innerHeight,
  0.1,
  1000,
);
//  正交相机
const camera = new THREE.OrthographicCamera(
  75,
  window.innerWidth / window.innerHeight,
  0.1,
  1000,
);
```

当然相机不只是有这俩种，在文档中可以搜索关键字`camera`会看到还有别的相机。

同样，我们也可以为相机设置一些属性，比如位置等
，[详细的 camera 的配置请查看文档](https://threejs.org/docs/index.html?q=cam#api/zh/cameras/Camera)

### 渲染器 renderer

渲染器，我们也要通过构造函数来创建。

```js
const renderer = new THREE.WebGLRenderer();
```

同样 renderer 也不只是有 WebGLRenderer 一种渲染器来渲染画布。可在文档中搜索关键
字`render`会有对应的渲染器被检索。渲染器也可以设置类似于位置等相关属性
，[详细的 camera 的配置请查看文档](https://threejs.org/docs/index.html?q=render#api/zh/renderers/WebGLRenderer)

创建完了场景，相机，渲染器之后，我们需要把某个东西渲染出来，本案例中采用渲染一个
简单的 glb 模型,当然也可以使用我们 threejs 提供的各种几何体来渲染。

通过简单的小案例，初步认识 threejs,接下来将会更简单。

附上本案例源码:

```html
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>three.js webgl - animation - keyframes</title>
    <style>
      * {
        margin: 0;
      }
    </style>
  </head>
  <body>
    <div id="container"></div>
    <script type="importmap">
      {
        "imports": {
          "three": "../build/three.module.js",
          "three/addons/": "./jsm/"
        }
      }
    </script>
    <script type="module">
      import * as THREE from 'three';
      import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
      import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
      import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
      import { DRACOLoader } from 'three/addons/loaders/DRACOLoader.js';
      let mixer;
      //	获取画布的dom节点
      const dom = document.getElementById('container');

      //	创建渲染函数,antialias是否执行抗锯齿
      const renderer = new THREE.WebGLRenderer({ antialias: true });
      //	设置渲染器的分辨率为设备的分辨率
      renderer.setPixelRatio(window.devicePixelTatio);
      //	设置渲染器的大小
      renderer.setSize(window.innerWidth, window.innerHeight);
      //	将渲染器添加到画布上
      dom.appendChild(renderer.domElement);

      const pmremGenerator = new THREE.PMREMGenerator(renderer);
      //	创建场景
      const scene = new THREE.Scene();
      //	为场景添加背景,通过THREE的颜色构造函数Color来创建，参数为16进制色值
      scene.background = new THREE.Color(0xbfe3dd);
      scene.environment = pmremGenerator.fromScene(
        new RoomEnvironment(renderer),
        0.04,
      ).texture;

      //	创建相机，通过PersperctiveCamera创建透视相机，透视相机是模拟人眼视觉
      const camera = new THREE.PerspectiveCamera(
        40,
        window.innerWidth / window.innerHeight,
        1,
        100,
      );
      //	设置相机的位置,x,y,z
      camera.position.set(5, 2, 8);

      const dracoLoader = new DRACOLoader();
      dracoLoader.setDecoderPath('jsm/libs/draco/gltf/');

      //	通过引入资源来创建物体
      const loader = new GLTFLoader();
      loader.setDRACOLoader(dracoLoader);
      loader.load('models/gltf/LittlestTokyo.glb', (gltf) => {
        const model = gltf.scene;
        //	设置物体的位置
        model.position.set(1, 1, 0);
        model.scale.set(0.01, 0.01, 0.01);
        //	将物体添加到场景中
        scene.add(model);
        //	通过动画的构造函数，创建动画
        mixer = new THREE.AnimationMixer(model);
        mixer.clipAction(gltf.animations[0]).play();
        animate();
      });

      //	创建轨道控制器，主要控制相机和画布
      const controls = new OrbitControls(camera, renderer.domElement);
      //	设定控制器的目标位置
      controls.target.set(0, 0.5, 0);
      controls.update();
      //	禁用相机平移
      controls.enablePan = false;
      //	打开控制器阻尼
      controls.enableDamping = true;

      const clock = new THREE.Clock();
      function animate() {
        requestAnimationFrame(animate);
        const delta = clock.getDelta();
        mixer.update(delta);
        controls.update();
        renderer.render(scene, camera);
      }
      window.onresize = () => {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
        renderer.setPixelRatio(window.devicePixelRatio);
      };
    </script>
  </body>
</html>
```
<iframe src="/static/cases/threejs/1_webgl_animation_keyframes.html"></iframe>