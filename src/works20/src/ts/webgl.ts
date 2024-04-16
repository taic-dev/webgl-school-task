import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { PARAMS } from "./params";
import vertexShader from "../shader/vertexShader.glsl";
import fragmentShader from "../shader/fragmentShader.glsl";
import { gsap } from "gsap";

export class Webgl {
  [x: string]: any;

  constructor() {
    this.renderer;
    this.camera;
    this.geometry;
    this.material;
    this.mesh;
    this.uniforms;
    this.scene = new THREE.Scene();

    this.texture = [];
    this.textureLength = PARAMS.TEXTURE.length;
    this.current = 0;

    this.render = this.render.bind(this);
  }

  _setRenderer(element: Element | null) {
    if (!element) return;
    this.renderer = new THREE.WebGLRenderer({ alpha: true });
    this.renderer.setSize(PARAMS.WINDOW.W, PARAMS.WINDOW.H);
    this.renderer.setPixelRatio(PARAMS.WINDOW.PIXEL_RATIO);
    element.appendChild(this.renderer.domElement);
  }

  _setCamera() {
    this.camera = new THREE.PerspectiveCamera(
      PARAMS.CAMERA.FOV,
      PARAMS.CAMERA.ASPECT,
      PARAMS.CAMERA.NEAR,
      PARAMS.CAMERA.FAR
    );
    // const fovRad = (PARAMS.CAMERA.FOV / 2) * (Math.PI / 180);
    // const dist = PARAMS.WINDOW.H / 2 / Math.tan(fovRad);

    this.camera.position.set(
      PARAMS.CAMERA.POSITION.X,
      PARAMS.CAMERA.POSITION.Y,
      PARAMS.CAMERA.POSITION.Z
    );

    this.camera.lookAt(0, 0, 0);
  }

  _setParticle() {
    const geometry = new THREE.BufferGeometry();

    const multiplier = 18;
    const nbColumns = 16 * multiplier;
    const nbLines = 9 * multiplier;

    const vertices: number[] = [];
    const rand: number[] = [];

    for (let i = 0; i < nbColumns; i++) {
      for (let j = 0; j < nbLines; j++) {
        const points = [i, j, 0];
        vertices.push(...points);
        rand.push((Math.random() - 1.0) * 2.0, (Math.random() - 1.0) * 2.0);
      }
    }

    const vertices32 = new Float32Array(vertices);
    const rands = new THREE.BufferAttribute(new Float32Array(rand), 2);

    geometry.setAttribute("position", new THREE.BufferAttribute(vertices32, 3));
    geometry.setAttribute("rand", rands);
    geometry.center();

    const loader = new THREE.TextureLoader();

    for (let i = 0; i < PARAMS.TEXTURE.length; i++) {
      this.texture.push(loader.load(PARAMS.TEXTURE[i]));
    }

    this.uniforms = {
      uPointSize: { value: 3 },
      uRatio: { value: 0 },
      uTime: { value: 0 },
      uSliderAnimation: { value: 500.0 },
      progress: { value: 0.0 },
      uTexture1: { value: this.texture[0] },
      uTexture2: { value: this.texture[1] },
      uNbColumns: { value: nbColumns },
      uNbLines: { value: nbLines },
    };

    this.material = new THREE.ShaderMaterial({
      uniforms: this.uniforms,
      vertexShader,
      fragmentShader,
      depthTest: false,
      depthWrite: false,
      transparent: true,
    });

    const mesh = new THREE.Points(geometry, this.material);
    this.scene.add(mesh);
  }

  _setAnimation() {
    gsap.to(this.material.uniforms.uSliderAnimation, {
      value: 0,
      duration: 1.5,
      ease: "power1.inOut",
    });
  }

  _setAutoPlay() {
    this._setAnimation();

    gsap.to(
      {},
      {
        ease: "none",
        duration: 1.5,
        repeat: -1.0,
        onRepeat: () => {
          this._setAnimation();
        },
      }
    );
  }

  _setSlider() {
    const prev = document.querySelector(".prev");
    const next = document.querySelector(".next");

    prev?.addEventListener("click", () => {
      const index =
        (this.current - 1 + PARAMS.TEXTURE.length) % PARAMS.TEXTURE.length;
      this.uniforms.uTexture2.value = this.texture[this.current];
      this.uniforms.progress.value = 0.0;

      gsap.to(this.uniforms.uSliderAnimation, {
        value: -100.0,
        duration: 1.5,
        onStart: () => {
          this.uniforms.uSliderAnimation.value = 0.0;
        },
        onComplete: () => {
          this.current = index;
          this.uniforms.uTexture1.value = this.texture[index];
          this.uniforms.progress.value = 1.0;
        },
      });
    });

    next?.addEventListener("click", () => {
      const index =
        (this.current + 1 + PARAMS.TEXTURE.length) % PARAMS.TEXTURE.length;
      this.uniforms.uTexture2.value = this.texture[this.current];
      this.uniforms.progress.value = 0.0;

      gsap.to(this.uniforms.uSliderAnimation, {
        value: 100.0,
        duration: 1.5,
        onStart: () => {
          this.uniforms.uSliderAnimation.value = 0.0;
        },
        onComplete: () => {
          this.current = index;
          this.uniforms.uTexture1.value = this.texture[index];
          this.uniforms.progress.value = 1.0;
        },
      });
    });
  }

  _setControls() {
    const controls = new OrbitControls(this.camera, this.renderer.domElement);
    controls.enableDamping = true;
  }

  _setAxesHelper() {
    const axesHelper = new THREE.AxesHelper(10);
    this.scene.add(axesHelper);
  }

  init() {
    const element = document?.querySelector(".webgl");
    this._setRenderer(element);
    this._setCamera();

    this._setControls();

    this._setParticle();
    this._setAutoPlay();

    this._setSlider();
  }

  render() {
    this.renderer.render(this.scene, this.camera);
    this.material.uniforms.uTime.value += 0.05;
    requestAnimationFrame(this.render);
  }

  onResize() {
    setTimeout(() => {
      this.renderer.setSize(window.innerWidth, window.innerHeight);
      this.camera.aspect = window.innerWidth / window.innerHeight;
      this.camera.updateProjectionMatrix();
      this.mesh.scale.set(window.innerWidth, window.innerHeight);
    }, 500);
  }
}
