import { gsap } from "gsap";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";

export class WebGL {
  [x: string]: any;
  static get RENDERER_PARAM() {
    return {
      clearColor: 0xffffff,
      width: window.innerWidth,
      height: window.innerHeight,
    }
  }

  static get CAMERA_PARAM() {
    return {
      fov: 50,
      aspect: window.innerWidth / window.innerHeight,
      near: 1.0,
      far: 1000.0,
      x: 0.0,
      y: 0.0,
      z: 5.0,
      lookAt: new THREE.Vector3()
    }
  }

  static get DIRECTIONAL_LIGHT_PARAM() {
    return {
      color: 0xffffff,
      intensity: 1.0,
      x: 0.0,
      y: 5.0,
      z: 5.0
    }
  }

  static get AMBIENT_LIGHT_PARAM() {
    return {
      color: 0xffffff,
      intensity: 1.0
    }
  }

  static get PLATFORM_PLANE_GEOMETERY_PARAM() {
    return {
      width: 100,
      height: 100,
      color: 0xCD5C5C
    }
  }

  static get PLANE_GEOMETERY_PARAM() {
    return {
      width: 1.5,
      height: 1
    }
  }

  constructor() {
    this.renderer;
    this.scene;
    this.camera;
    this.directionalLight;
    this.ambientLight;
    this.platformPlane
    this.plane;
    this.controls;
    this.axesHelper

    // 再帰呼び出しのための this 固定
    this.render = this.render.bind(this);

    this.raycaster = new THREE.Raycaster();
    window.addEventListener('click', (event) => {
      const x = event.clientX / window.innerWidth * 2.0 - 1.0
      const y = event.clientY / window.innerHeight * 2.0 - 1.0
      const v = new THREE.Vector2(x, -y);

      this.raycaster.setFromCamera(v, this.camera);
      const intersects = this.raycaster.intersectObject(this.plane);
      console.log(intersects)

      if(intersects.length > 0) {
        const intersect = intersects[0].object
        gsap.to(intersect.rotation, { x: 6 })
        gsap.to(intersect.position, { x: 3 })
      }
    })
  }

  init() {
    // レンダラー
    this.renderer = new THREE.WebGLRenderer();
    this.renderer.setClearColor(new THREE.Color(WebGL.RENDERER_PARAM.clearColor))
    this.renderer.setSize(WebGL.RENDERER_PARAM.width, WebGL.RENDERER_PARAM.height)
    const wrapper = document.querySelector('.webgl');
    wrapper?.appendChild(this.renderer.domElement)

    // シーン
    this.scene = new THREE.Scene();

    // カメラ
    this.camera = new THREE.PerspectiveCamera(
      WebGL.CAMERA_PARAM.fov,
      WebGL.CAMERA_PARAM.aspect,
      WebGL.CAMERA_PARAM.near,
      WebGL.CAMERA_PARAM.far,
    )

    this.camera.position.set(
      WebGL.CAMERA_PARAM.x,
      WebGL.CAMERA_PARAM.y,
      WebGL.CAMERA_PARAM.z,
    )

    this.camera.lookAt(WebGL.CAMERA_PARAM.lookAt)

    // ライト
    this.directionalLight = new THREE.DirectionalLight(
      WebGL.DIRECTIONAL_LIGHT_PARAM.color,
      WebGL.DIRECTIONAL_LIGHT_PARAM.intensity
    )
    
    this.directionalLight.position.set(
      WebGL.DIRECTIONAL_LIGHT_PARAM.x,
      WebGL.DIRECTIONAL_LIGHT_PARAM.y,
      WebGL.DIRECTIONAL_LIGHT_PARAM.z
    )
    this.scene.add(this.directionalLight)

    this.ambientLight = new THREE.AmbientLight(
      WebGL.AMBIENT_LIGHT_PARAM.color,
      WebGL.AMBIENT_LIGHT_PARAM.intensity
    )
    this.scene.add(this.ambientLight)

    // platformPlane
    const platformPlaneGeometery = new THREE.PlaneGeometry(WebGL.PLATFORM_PLANE_GEOMETERY_PARAM.width, WebGL.PLATFORM_PLANE_GEOMETERY_PARAM.height)
    const platformPlaneMaterial = new THREE.MeshPhongMaterial({ color: WebGL.PLATFORM_PLANE_GEOMETERY_PARAM.color });
    this.platformPlane = new THREE.Mesh(platformPlaneGeometery, platformPlaneMaterial)
    this.platformPlane.position.set(0, 0, -1)
    this.scene.add(this.platformPlane)

    // plane
    const planeGeometry = new THREE.PlaneGeometry(WebGL.PLANE_GEOMETERY_PARAM.width, WebGL.PLANE_GEOMETERY_PARAM.height)
    const planeMaterial = new THREE.MeshPhongMaterial({ color: 0x000000 });
    this.plane = new THREE.Mesh(planeGeometry, planeMaterial);
    this.scene.add(this.plane);

    // コントロール
    this.controls = new OrbitControls(this.camera, this.renderer.domElement)

    // ヘルパー
    this.axesHelper = new THREE.AxesHelper(5.0)
    this.scene.add(this.axesHelper)   
  }

  render() {
    requestAnimationFrame(this.render)
    this.renderer.render(this.scene, this.camera)
  }
}