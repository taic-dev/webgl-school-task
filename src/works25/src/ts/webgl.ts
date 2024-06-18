import gsap from "gsap";
import * as THREE from "three";
import vertexShader from "../shader/vertexShader.glsl";
import fragmentShader from "../shader/fragmentShader.glsl";
import cardBack from "../img/card-bg.png";
import effectColor1 from "../img/effect1.jpg";
import effectColor2 from "../img/effect2.jpg";
import { EASING, PARAMS, textureArray } from "./constants";
import { clientRectCoordinate, mouseCoordinate } from "./utils";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";

export class Webgl {
  renderer: THREE.WebGLRenderer | undefined;
  camera: THREE.PerspectiveCamera | undefined;
  scene: THREE.Scene;
  geometry: THREE.PlaneGeometry | undefined;
  material: THREE.ShaderMaterial | undefined;
  uniforms: any;
  mesh: THREE.Mesh | undefined;
  clock: THREE.Clock | undefined;
  cards: HTMLImageElement[] | null;
  imageElement: HTMLImageElement | null;
  planeArray: { mesh: THREE.Mesh; image: HTMLElement; }[]
  controls: OrbitControls | undefined;
  mouse: THREE.Vector2;
  isModal: boolean

  constructor() {
    this.camera;
    this.geometry;
    this.uniforms;
    this.material;
    this.mesh;
    this.scene = new THREE.Scene();
    this.clock = new THREE.Clock();
    this.cards = [...document.querySelectorAll<HTMLImageElement>('.card img')];
    this.imageElement = document.querySelector<HTMLImageElement>(
      ".image__wrapper img"
    );
    this.planeArray = [];
    this.controls;
    this.mouse = new THREE.Vector2();
    this.isModal = false

    this.render = this.render.bind(this);
  }

  setCanvas() {
    const element = document.querySelector(".webgl");
    this.renderer = new THREE.WebGLRenderer({ alpha: true });
    this.renderer.setSize(PARAMS.WINDOW.W, PARAMS.WINDOW.H);
    this.renderer.setPixelRatio(PARAMS.WINDOW.PIXEL_RATIO);
    element?.appendChild(this.renderer.domElement);
  }

  setCamera() {
    this.camera = new THREE.PerspectiveCamera(
      PARAMS.CAMERA.FOV,
      PARAMS.CAMERA.ASPECT,
      PARAMS.CAMERA.NEAR,
      PARAMS.CAMERA.FAR
    );

    const fovRad = (60 / 2) * (Math.PI / 180);
    const dist = window.innerHeight / 2 / Math.tan(fovRad);

    this.camera.position.set(0, 0, dist);
  }

  initMesh() {
    this.cards?.forEach((image, index) => {
      const mesh = this.setMesh(image, index)
      this.scene.add(mesh);
      mesh.rotation.y = Math.PI / 180 * -180

      this.setMeshPosition(mesh, image);
      this.planeArray.push({ mesh, image });
    })
  }

  setMesh(image: HTMLImageElement, index: number) {
    this.geometry = new THREE.PlaneGeometry(1, 1, 10, 10);

    const loader = new THREE.TextureLoader();
    const frontTexture = loader.load(textureArray[index]);
    const textureBack = loader.load(cardBack);

    const effectTexture1 = loader.load(effectColor1);
    effectTexture1.wrapS = THREE.RepeatWrapping;
    effectTexture1.wrapT = THREE.RepeatWrapping;
    const effectTexture2 = loader.load(effectColor2);

    const number = index + 1;

    this.uniforms = {
      uResolution: {
        value: {
          x: image.clientWidth,
          y: image.clientHeight,
        },
      },
      uMouse: { value: { x: 0, y: 0 } },
      uIndex: { value: number },
      uFrontTexture: { value: frontTexture },
      uTextureBack: { value: textureBack },
      uImageAspect: { value: image.naturalWidth / image.naturalHeight },
      uPlaneAspect: { value: image.clientWidth / image.clientHeight },
      uLoading: { value: 0 },
      uTime: { value: 0 },
      uEffectTexture1: { value: effectTexture1 },
      uEffectTexture2: { value: effectTexture2 },
    };

    this.material = new THREE.ShaderMaterial({
      uniforms: this.uniforms,
      vertexShader,
      fragmentShader,
      side: THREE.DoubleSide,
    });

    this.mesh = new THREE.Mesh(this.geometry, this.material);
    return this.mesh;
  }

  setMeshPosition(mesh: THREE.Mesh, image: HTMLElement) {
    const rect = image.getBoundingClientRect();
    const { x, y } = clientRectCoordinate(rect);

    mesh.position.set(x, y, 1);

    mesh.scale.x = rect.width;
    mesh.scale.y = rect.height;
  }

  moveMouseEvent() {
    if(!this.isModal) return
    this.imageElement?.addEventListener("mousemove", (e) => {
      if (!this.imageElement || !this.mesh) return;

      const { x, y } = mouseCoordinate(e, this.imageElement);

      (this.mesh.material as any).uniforms.uMouse.value = { x, y };

      gsap.to(this.mesh.rotation, {
        x: y * 0.7,
        y: -x * 0.7,
        duration: 0.5,
        ease: "power1.out",
      });
    });

    this.imageElement?.addEventListener("mouseleave", (e) => {
      if (!this.mesh) return;

      gsap.to(this.mesh.rotation, {
        x: 0,
        y: 0,
        duration: 0.5,
        ease: EASING.transform
      });

      gsap.to((this.mesh.material as any).uniforms.uMouse.value, {
        x: 0,
        y: 0,
        duration: 0.5,
        ease: EASING.transform
      });
    })
  }

  setHelper() {
    if (!this.camera) return;
    // OrbitControls
    this.controls = new OrbitControls(this.camera, this.renderer?.domElement);

    // AxesHelper
    const axesHelper = new THREE.AxesHelper(2000);
    this.scene.add(axesHelper);
  }

  onResize() {
    setTimeout(() => {
      if (!this.camera) return;
      this.renderer?.setSize(window.innerWidth, window.innerHeight);
      this.camera.aspect = window.innerWidth / window.innerHeight;
      this.camera.updateProjectionMatrix();
    }, 500);
  }

  init() {
    this.setCanvas();
    this.setCamera();
    this.initMesh();
    this.moveMouseEvent();
    this.setHelper();
  }

  render() {
    if (!this.camera || !this.mesh || !this.controls) return;
    this.renderer?.render(this.scene, this.camera);

    const time = this.clock?.getElapsedTime();
    (this.mesh.material as any).uniforms.uTime.value = time;

    this.controls.update();

    this.planeArray.forEach((plane) => {
      this.setMeshPosition(plane.mesh, plane.image);
    })

    requestAnimationFrame(this.render);
  }
}
