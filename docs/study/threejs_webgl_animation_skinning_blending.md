---
title: webgl animation skinning blending
order: 3
group: threejs
toc: content
---
通过上一个案例，学习了Scene,Camera,renderer还有导入gltf模型，绘制出了第一个3d模型，本节继续学习在场景中添加灯光，和素材。

## 半球光HemisphereLight
通过new THREE.HemisphereLight()来创建半球光，光源直接放置于场景之上，光照颜色从天空光线颜色渐变到地面光线颜色。
接受三个参数：
+ 第一个参数skyColor，表示天空发出光线的颜色；
+ 第二个参数groundColor,表示地面发出光线的颜色；
+ 第三个参数表示光照的强度

## 平行光DirectionalLight
通过new THREE.DirectionalLight()来创建平行光，平行光是沿着特定方向发射的光。这种光的表现像是无限远，从它发出的光线都是平行的。常常用平行光来模拟太阳光的效果。 太阳足够远，因此我们可以认为太阳的位置是无限远，所以我们认为从太阳发出的光线也都是平行的。
接受俩个参数：
+ color光的颜色
+ intensity光的强度

同时，给平行光设定了阴影参数shadow

## 几何平面PlaneGeometry
通过new THREE.PlaneGeometry()创建了一个几何平面作为地面，通过new THREE.MeshPhongMaterial()创建了平面的素材，作为平面的素材，添加到了场景中。

附上本案例源码:
```html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>three.js webgl - animation - skinning</title>
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
                "three": "https://Leexiaop.github.io/static/cdn/three.module.js",
                "three/addons/": "https://Leexiaop.github.io/static/threejs_offical_resource/jsm/"
            }
        }
    </script>
    <script type="module">
        import * as THREE from 'three'
        import { OrbitControls } from 'three/addons/controls/OrbitControls.js'
        import { GUI } from 'three/addons/libs/lil-gui.module.min.js'
		import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js'

        let model, mixer, skeleton, actions, settings,
            crossFadeControls = [], singleStepMode = false,
            sizeOfNextStep = 0, idleAction, walkAction,
            runAction, idleWeight, walkWeight, runWeight;

        const clock = new THREE.Clock()
        const dom = document.getElementById("container")
        //  创建场景
        const scene = new THREE.Scene()
        //  为场景添加背景
        scene.background = new THREE.Color(0xa0a0a0)
        //  设置场景中增加雾
        scene.fog = new THREE.Fog(0xcccccc, 10, 15)

        //  创建相机
        const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000)
        //  设置相机的位置
        camera.position.set(1, 2, -3)
        //  设置相机看向的位置
        camera.lookAt(0, 1, 0)
        //  将相机添加到场景中
        scene.add(camera)

        //  创建半球光
        const hemiLight = new THREE.HemisphereLight(0xffffff, 0x8d8d8d, 3);
        //  设置半球光的位置
        hemiLight.position.set(0, 20, 0);
        scene.add(hemiLight);

        //  创建平行光源
        const dLight = new THREE.DirectionalLight(0xffffff, 3)
        //  设置平行光源的位置
        dLight.position.set(-3, 10, -10)
        //  开启平行灯的阴影
        dLight.castShadow = true
        dLight.shadow.camera.top = 2
        dLight.shadow.camera.bottom = -2
        dLight.shadow.camera.left = -2
        dLight.shadow.camera.right = 2
        dLight.shadow.camera.near = 0.1
        dLight.shadow.camera.far = 40
        scene.add(dLight)

        //  创建一个平面几何体
        const planeGeometry = new THREE.PlaneGeometry(100, 100)
        //  平面几何体网格材质
        const planeMaterial = new THREE.MeshPhongMaterial({
            color: 0xcbcbcb,    //  材质的颜色
            depthWrite: false,   //  渲染此材质是否对深度缓冲区有任何影响
            side: THREE.DubbleSide
        })
        const mesh = new THREE.Mesh(planeGeometry, planeMaterial)
        mesh.rotation.x = - Math.PI / 2 //  沿x周旋转180度
        mesh.receiveShadow = true   //  阴影
        scene.add(mesh)

        //  导入素材
        const loader = new GLTFLoader()
        loader.load('https://Leexiaop.github.io/static/threejs_offical_resource/models/gltf/Soldier.glb', gltf => {
            console.log(gltf)
            model = gltf.scene
            scene.add(model)
            model.traverse(object => {
                if (object.isMesh) {
                    //  设置影子
                    object.castShadow = true
                }
            })

            //  添加骨架
            skeleton = new THREE.SkeletonHelper(model)
            skeleton.visible = false
            scene.add(skeleton)

            mixer = new THREE.AnimationMixer(model)
            const animations = gltf.animations
            // actions = animations.map(animation => {
            //     return mixer.clipAction(animation)
            // })
			idleAction = mixer.clipAction(animations[0]);
            walkAction = mixer.clipAction(animations[3]);
			runAction = mixer.clipAction(animations[1]);
            actions = [idleAction, walkAction, runAction];
            createPannel()
            activateAllActions()
            animation()
        })

        //  创建渲染器,开启抗锯齿
        const renderer = new THREE.WebGLRenderer({antialias: true})
        //  设置渲染器的大小
        renderer.setSize(window.innerWidth, window.innerHeight)
        //  设置渲染器的分辨率
        renderer.setPixelRatio(window.devicePixelRatio)
        //  允许场景中使用阴影贴图
        renderer.shadowMap.enabled = true
        dom.appendChild(renderer.domElement)

        //	创建轨道控制器，主要控制相机和画布
		const controls = new OrbitControls(camera, renderer.domElement)
		//	设定控制器的目标位置
		controls.target.set( 0, 0.5, 0 )
		controls.update()
		//	禁用相机平移
		controls.enablePan = false
		//	打开控制器阻尼
		controls.enableDamping = true

        function animation () {
            requestAnimationFrame(animation)
            idleWeight = idleAction.getEffectiveWeight();
            walkWeight = walkAction.getEffectiveWeight();
            runWeight = runAction.getEffectiveWeight();
			updateWeightSliders();
            updateCrossFadeControls()
            controls.update()
            let mixerUpdateDelta = clock.getDelta()
            if (singleStepMode) {
                mixerUpdateDelta = sizeOfNextStep
                sizeOfNextStep = 0
            }
            mixer.update(mixerUpdateDelta)
            renderer.render(scene, camera)
        }

        function updateWeightSliders () {
            settings['modify idle weight'] = idleWeight;
            settings['modify walk weight'] = walkWeight;
            settings['modify run weight'] = runWeight;
        }

        function updateCrossFadeControls() {
            if (idleWeight === 1 && walkWeight === 0 && runWeight === 0) {
                crossFadeControls[0].disable();
                crossFadeControls[1].enable();
                crossFadeControls[2].disable();
                crossFadeControls[3].disable();
            }

            if (idleWeight === 0 && walkWeight === 1 && runWeight === 0) {
                crossFadeControls[0].enable();
                crossFadeControls[1].disable();
                crossFadeControls[2].enable();
                crossFadeControls[3].disable();

            }

            if (idleWeight === 0 && walkWeight === 0 && runWeight === 1) {
                crossFadeControls[0].disable();
                crossFadeControls[1].disable();
                crossFadeControls[2].disable();
                crossFadeControls[3].enable();
            }
        }
        function createPannel () {
            const pannel = new GUI({
                width: 350
            })
            const folder1 = pannel.addFolder("Visibility")
            const folder2 = pannel.addFolder("Activation/Deactivation")
            const folder3 = pannel.addFolder("Pausing/Stepping")
            const folder4 = pannel.addFolder("Crossfading")
            const folder5 = pannel.addFolder("Blend Weights")
            const folder6 = pannel.addFolder("General Speed")

            settings = {
                'show model': true,
                'show skeleton': false,
                'deactivate all': deactivateAllActions,
                'activate all': activateAllActions,
                'pause/continue': pauseContinue,
                'make single step': toSingleStepMode,
                'modify step size': 0.05,
                'from walk to idle': () => {
                    prepareCrossFade(walkAction, idleAction, 1.0)
                },
                'from idle to walk': () => {
                    prepareCrossFade(idleAction, walkAction, 0.5)
                },
                'from walk to run': () => {
                    prepareCrossFade(walkAction, runAction, 2.5)
                },
                'from run to walk': () => {
                    prepareCrossFade(runAction, walkAction, 5.0)
                },
                'use default duration': true,
                'set custom duration': 3.5,
                'modify idle weight': 0.0,
                'modify walk weight': 1.0,
                'modify run weight': 0.0,
                'modify time scale': 1.0
            }

            folder1.add(settings, 'show model').onChange(showModel)
            folder1.add(settings, 'show skeleton').onChange(shwoSkeleton)
            folder2.add(settings, 'deactivate all')
            folder2.add(settings, 'activate all')
            folder3.add(settings, 'pause/continue');
            folder3.add(settings, 'make single step');
            folder3.add(settings, 'modify step size', 0.01, 0.1, 0.001);
            crossFadeControls.push(folder4.add(settings, 'from walk to idle'));
            crossFadeControls.push(folder4.add(settings, 'from idle to walk'));
            crossFadeControls.push(folder4.add(settings, 'from walk to run'));
            crossFadeControls.push(folder4.add(settings, 'from run to walk'));
            folder4.add(settings, 'use default duration' );
            folder4.add(settings, 'set custom duration', 0, 10, 0.01);
            folder5.add(settings, 'modify idle weight', 0.0, 1.0, 0.01).listen().onChange(weight => {
                setWeight(idleAction, weight)
            });
            folder5.add(settings, 'modify walk weight', 0.0, 1.0, 0.01).listen().onChange(weight => {
                setWeight(walkAction, weight)
            });
            folder5.add(settings, 'modify run weight', 0.0, 1.0, 0.01).listen().onChange(weight => {
                setWeight(runAction, weight)
            });
            folder6.add(settings, 'modify time scale', 0.0, 1.5, 0.01).onChange(speed => mixer.timeScal = speed);
            folder1.open();
            folder2.open();
            folder3.open();
            folder4.open();
            folder5.open();
            folder6.open();
        }

        function showModel (visible) {
            model.visible = visible
        }
        function shwoSkeleton (visible) {
            skeleton.visible = visible
        }
        function deactivateAllActions () {
            actions.forEach(action => {
                action.stop()
            })
        }
        function activateAllActions () {
            actions.forEach(action => {
                setWeight(action, settings[`modify ${action._clip.name.toLowerCase()} weight`])
                action.play()
            })
        }

        function setWeight (action, weight) {
            action.enabled = true
            action.setEffectiveTimeScale(1);
			action.setEffectiveWeight(weight);
        }

        function pauseContinue () {
            if (singleStepMode) {
                singleStepMode = false
                unPanseAllActions()
                return
            }
            let idleAction = actions.find(action => action._clip.name === 'Idle')
            if (idleAction.paused) {
                unPanseAllActions()
            } else {
                pauseAllActions()
            }
        }

        function pauseAllActions () {
            actions.forEach(action => {
                action.paused = true;
            })
        }

        function unPanseAllActions () {
            actions.forEach(action => {
                action.paused = false
            })
        }

        function toSingleStepMode () {
            unPanseAllActions()
            singleStepMode = true
            sizeOfNextStep = settings['modify step size']
        }

        function prepareCrossFade (start, end, defaultDuration) {
            const duration = setCrossFadeDuration(defaultDuration)
            singleStepMode = false
            unPanseAllActions()
            if (start === idleAction) {
                executeCrossFade(start, end, duration);
            } else {
                synchronizeCrossFade(start, end, duration);
            }
        }

        function setCrossFadeDuration (defaultDuration) {
            if (settings['use default duration']) {
                return defaultDuration
            }

            return settings['set custom duration']
        }
        function synchronizeCrossFade (start, end, duration) {
            mixer.addEventListener('loop', onLoopFinished)
            function onLoopFinished (event) {
                if (event.action === start) {
                    mixer.removeEventListener( 'loop', onLoopFinished );
					executeCrossFade(start, end, duration);
                }
            }
        }
        function executeCrossFade (start, end, duration) {
            setWeight(end, 1)
            end.time = 0
            start.crossFadeTo(end, duration, true)
        }
        window.onresize = () => {
            camera.aspect = window.innerWidth / window.innerHeight
            camera.updateProjectionMatrix()
            renderer.setSize(window.innerWidth, window.innerHeight)
            renderer.setPixelRatio(window.devicePixelRatio)
        }
    </script>
</body>
</html>
```

<iframe src="https://leexiaop.github.io/static/cases/threejs/2_webgl_animation_skinning_blending.html"></iframe>