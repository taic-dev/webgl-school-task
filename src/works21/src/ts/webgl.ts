import * as THREE from "three";
import { PARAMS } from "./params";
import vertexShader from "../shader/vertexShader.glsl";
import fragmentShader from "../shader/fragmentShader.glsl";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { lerp } from "./utiles";
import { gsap } from "gsap";

export class Webgl {
  [x: string]: any;

  constructor() {
    this.renderer;
    this.camera;
    this.geometry;
    this.material;
    this.scene = new THREE.Scene();
    this.clock = new THREE.Clock();
    this.textureArray = [];
    this.pointer = new THREE.Vector2(0, 0);
    this.offset = new THREE.Vector2(0, 0);
    this.targetX = 0;
    this.targetY = 0;
    this.hovered = false;
    this.isClick = false;

    this.list = [...document.querySelectorAll(".item")];
    this.movieList = [...document.querySelectorAll(".item video")];
    this.modal = document.querySelector(".modal");
    this.modalImage = document.querySelector(".modal-image");
    this.modalClose = document.querySelector(".modal-button");
    this.wrapper = document.querySelector(".wrapper");
    this.index = 0;
    this.render = this.render.bind(this);
  }

  _setRenderer(element: HTMLElement | null) {
    if (!element) return;
    this.renderer = new THREE.WebGLRenderer({ alpha: true });
    this.renderer.setSize(PARAMS.WINDOW.W, PARAMS.WINDOW.H);
    this.renderer.setPixelRatio(PARAMS.WINDOW.PIXEL_RATIO);
    element?.appendChild(this.renderer.domElement);
  }

  _setCamera() {
    this.camera = new THREE.PerspectiveCamera(
      PARAMS.CAMERA.FOV,
      PARAMS.CAMERA.ASPECT,
      PARAMS.CAMERA.NEAR,
      PARAMS.CAMERA.FAR
    );
    const fovRad = (PARAMS.CAMERA.FOV / 2) * (Math.PI / 180);
    const dist = PARAMS.WINDOW.H / 2 / Math.tan(fovRad);

    this.camera.position.set(
      PARAMS.CAMERA.POSITION.X,
      PARAMS.CAMERA.POSITION.Y,
      dist
    );
  }

  _setMesh() {
    this.geometry = new THREE.PlaneGeometry(1, 1, 20, 20);
    this.uniforms = {
      uTime: { value: 0 },
      uPlaneAspect: { value: 1 },
      uImageAspect: { value: 1 },
      uResolution: { value: { x: window.innerWidth, y: window.innerHeight } },
      uTexture: { value: this.textureArray[this.index] },
      uMousePointer: { value: this.pointer },
      uOffset: { value: new THREE.Vector2(0.0, 0.0) },
      uAlpha: { value: 0 },
    };

    this.material = new THREE.ShaderMaterial({
      uniforms: this.uniforms,
      vertexShader,
      fragmentShader,
      side: THREE.DoubleSide,
    });

    this.mesh = new THREE.Mesh(this.geometry, this.material);
    this.scene.add(this.mesh);
    this.mesh.scale.set(350, 250, 1);
    this.mesh.position.set(PARAMS.WINDOW.W / 2, PARAMS.WINDOW.H / 2);
  }

  _loadTexture() {
    for (const movie of this.movieList) {
      movie.play();
      const movieTexture = new THREE.VideoTexture(movie);
      this.textureArray.push(movieTexture);
    }
  }

  _mouseEvent() {
    this.list.forEach((element: HTMLElement) => {
      element.addEventListener("mouseenter", () => {
        this.index = Number(element.getAttribute("data-list-no")) - 1;

        gsap.to(this.material.uniforms.uAlpha, {
          value: 1,
          duration: 1,
          ease: "power2.inOut",
        });
      });

      element.addEventListener("mouseleave", () => {
        if (!this.isClick) {
          gsap.to(this.material.uniforms.uAlpha, {
            value: 0,
            duration: 0.5,
            ease: "power2.inOut",
          });
        }
      });

      this.mesh.position.set(
        this.offset.x - PARAMS.WINDOW.W / 2,
        -this.offset.y + PARAMS.WINDOW.H / 2,
        1
      );
    });
  }

  _onClickEvent() {
    this.list.forEach((element: HTMLElement) => {
      element.addEventListener("click", () => {
        this.isClick = true;
        const { width, height, top, left } =
          this.modalImage.getBoundingClientRect();

        const x = left - PARAMS.WINDOW.W / 2 + width / 2;
        const y = -top + PARAMS.WINDOW.H / 2 - height / 2;

        gsap.to(this.mesh.position, {
          x,
          y,
          duration: 1,
          ease: "power2.inOut",
        });

        gsap.to(this.mesh.scale, {
          x: width,
          y: height,
          duration: 1,
          ease: "power2.inOut",
        });

        this.wrapper.classList.toggle("is-hidden");
        this.modal.classList.toggle("is-show");
      });
    });

    this.modalClose.addEventListener("click", () => {
      this.isClick = false;
      this.isModal = false;

      gsap.to(this.mesh.position, {
        x: this.offset.x - PARAMS.WINDOW.W / 2,
        y: -this.offset.y + PARAMS.WINDOW.H / 2,
        duration: 1,
        ease: "power2.inOut",
      });

      gsap.to(this.mesh.scale, {
        x: 350,
        y: 250,
        duration: 1,
        ease: "power2.inOut",
      });

      this.wrapper.classList.toggle("is-hidden");
      this.modal.classList.toggle("is-show");
      setTimeout(() => {
        this.modal.scroll({ top: 0 });
      }, 1000);
    });
  }

  _onPointerMove(event: MouseEvent) {
    this.pointer.x = (event.clientX / window.innerWidth) * 2 - 1;
    this.pointer.y = (event.clientY / window.innerHeight) * 2 + 1;

    this.targetX = event.clientX;
    this.targetY = event.clientY;
  }

  _setControl() {
    const controls = new OrbitControls(this.camera, this.renderer.domElement);
    controls.enableDamping = true;

    const axesHelper = new THREE.AxesHelper(300);
    this.scene.add(axesHelper);
  }

  _onResize() {
    setTimeout(() => {
      this.renderer.setSize(window.innerWidth, window.innerHeight);
      this.camera.aspect = window.innerWidth / window.innerHeight;
      this.camera.updateProjectionMatrix();
      this.material.uniforms.uResolution.value = {
        x: window.innerWidth,
        y: window.innerHeight,
      };
      this.mesh.position.set(
        this.offset.x - PARAMS.WINDOW.W / 2,
        -this.offset.y + PARAMS.WINDOW.H / 2,
        1
      );
    }, 500);
  }

  init() {
    this._setRenderer(document?.querySelector(".webgl"));
    this._setCamera();
    this._loadTexture();
    this._setMesh();
    this._mouseEvent();
    this._onClickEvent();
  }

  render() {
    this.renderer.render(this.scene, this.camera);
    this.offset.x = lerp(this.offset.x, this.targetX, 0.1);
    this.offset.y = lerp(this.offset.y, this.targetY, 0.1);

    this.uniforms.uOffset.value.set(
      (this.targetX - this.offset.x) * 0.001,
      -(this.targetY - this.offset.y) * 0.001
    );

    requestAnimationFrame(this.render);
    this.material.uniforms.uTime.value += Math.abs(Math.sin(0.01));
    this.material.uniforms.uTexture.value = this.textureArray[this.index];

    if (this.isClick) {
      setTimeout(() => {
        const { width, height, top, left } =
          this.modalImage.getBoundingClientRect();
        const x = left - PARAMS.WINDOW.W / 2 + width / 2;
        const y = -top + PARAMS.WINDOW.H / 2 - height / 2;
        this.mesh.position.set(x, y);
      }, 1000);
    } else {
      this.mesh.position.set(
        this.offset.x - PARAMS.WINDOW.W / 2,
        -this.offset.y + PARAMS.WINDOW.H / 2,
        1
      );
    }
  }
}
