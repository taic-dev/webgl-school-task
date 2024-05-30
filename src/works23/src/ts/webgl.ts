import * as THREE from "three";
import displacement from "../img/displacement.jpg";
import vertexShader from "../shader/vertexShader.glsl";
import fragmentShader from "../shader/fragmentShader.glsl";
import gsap from "gsap";
import { EASING } from "./constants";

export class Webgl {
  renderer: THREE.WebGLRenderer | undefined;
  camera: THREE.PerspectiveCamera | undefined;
  scene: THREE.Scene;
  geometry: THREE.PlaneGeometry | undefined;
  material: THREE.ShaderMaterial | undefined;
  mesh: THREE.Mesh | undefined;
  uniforms: any;
  targetScrollY: number;
  currentScrollY: number;
  scrollOffset: number;
  offset: number;
  time: number;
  isOpen: boolean;
  images: HTMLImageElement[];
  modal: HTMLElement | null;
  modalImage: HTMLElement | null;
  close: HTMLElement | null;
  planeArray: { image: HTMLImageElement; mesh: THREE.Mesh }[];

  constructor() {
    this.renderer;
    this.camera;
    this.scene = new THREE.Scene();
    this.geometry;
    this.material;
    this.mesh;
    this.uniforms;
    this.targetScrollY = 0;
    this.currentScrollY = 0;
    this.scrollOffset = 0;
    this.offset = 0;
    this.time = 0;
    this.isOpen = false;

    this.render = this.render.bind(this);
    this.modal = document.querySelector(".modal");
    this.modalImage = document.querySelector(".modal-image");
    this.images = [
      ...document.querySelectorAll(".item-image img"),
    ] as HTMLImageElement[];
    this.close = document.querySelector(".close");
    this.planeArray = [];
  }

  setCanvas() {
    const webgl = document.querySelector(".webgl");
    this.renderer = new THREE.WebGLRenderer({ alpha: true });
    this.renderer.setPixelRatio(window.devicePixelRatio);
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    webgl?.appendChild(this.renderer.domElement);
  }

  setCamera() {
    this.camera = new THREE.PerspectiveCamera(
      60,
      window.innerWidth / window.innerHeight,
      1,
      1000
    );

    const fovRad = (60 / 2) * (Math.PI / 180);
    const dist = window.innerHeight / 2 / Math.tan(fovRad);

    this.camera.position.set(0, 0, dist);
  }

  setMesh(image: HTMLImageElement) {
    this.geometry = new THREE.PlaneGeometry(1, 1, 1, 1);

    const loader = new THREE.TextureLoader();

    this.uniforms = {
      uTexture: { value: loader.load(image.src) },
      uDisplacement: { value: loader.load(displacement) },
      uImageAspect: { value: image.naturalWidth / image.naturalHeight },
      uPlaneAspect: { value: image.clientWidth / image.clientHeight },
      uOffset: { value: this.scrollOffset },
      uTime: { value: this.time },
    };

    this.material = new THREE.ShaderMaterial({
      uniforms: this.uniforms,
      vertexShader,
      fragmentShader,
    });

    this.mesh = new THREE.Mesh(this.geometry, this.material);
    return this.mesh;
  }

  setMeshPosition(img: HTMLImageElement, mesh: THREE.Mesh, offset: number) {
    const rect = img.getBoundingClientRect();
    mesh.scale.x = rect.width;
    mesh.scale.y = rect.height;

    const x = rect.left - window.innerWidth / 2 + rect.width / 2;
    const y = -rect.top + window.innerHeight / 2 - rect.height / 2;

    mesh.position.set(x, y, mesh.position.z);
    (mesh.material as any).uniforms.uOffset.value = offset;
    (mesh.material as any).uniforms.uTime.value = this.time++;
  }

  openModal(mesh: THREE.Mesh) {
    const rect = this.modalImage?.getBoundingClientRect();
    if (!rect) return;

    const x = rect.left - window.innerWidth / 2 + rect.width / 2;
    const y = -rect.top + window.innerHeight / 2 - rect.height / 2;

    const tl = gsap.timeline();

    tl.to(mesh.position, {
      x,
      y,
      z: 1,
      duration: 1.5,
      delay: 1,
      ease: "power2.easeOut",
    },'<').to(
      mesh.scale,
      {
        x: rect.width,
        y: rect.height,
        duration: 1.5,
        delay: 1,
        ease: "power2.easeOut",
      },
      "<"
    );
  }

  closeModal(img: HTMLImageElement) {
    img.classList.remove("is-active");
    this.modal?.classList.remove("is-show");
    document.documentElement.classList.remove("is-hidden");
    document.body.classList.remove("is-hidden");

    setTimeout(() => {
      this.isOpen = false;
    }, 2500);
  }

  updateMesh(img: HTMLImageElement, mesh: any, offset: number) {
    img.addEventListener("click", () => {
      img.classList.add("is-active");
      document.documentElement.classList.add("is-hidden");
      document.body.classList.add("is-hidden");
      this.modal?.classList.add("is-show");
      this.isOpen = true;

      this.openModal(mesh);
    });

    this.close?.addEventListener("click", () => {
      if (img.classList.contains("is-active")) {
        this.hideImage(mesh.material.uniforms.uOffset);
      }

      this.closeModal(img);
    });

    if (this.isOpen) {
      if (!img.classList.contains("is-active")) {
        this.hideImage(mesh.material.uniforms.uOffset);
      }
    } else {
      this.setMeshPosition(img, mesh, offset);
    }
  }

  onScroll() {
    const lerp = (start: number, end: number, multiplier: number) => {
      return (1 - multiplier) * start + multiplier * end;
    };

    this.targetScrollY = document.documentElement.scrollTop;
    this.currentScrollY = lerp(this.currentScrollY, this.targetScrollY, 0.1);
    this.scrollOffset = this.targetScrollY - this.currentScrollY;
    this.offset = this.scrollOffset;
  }

  hideImage(target: any) {
    gsap.to(target, {
      value: -2500,
      duration: 0.5,
      ease: EASING.transform,
    });
  }

  showImage(target: any) {
    gsap.to(target, {
      value: 0,
      duration: 0.5,
      ease: EASING.transform,
    });
  }

  onResize() {
    if (!this.camera || !this.renderer) return;
    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  }

  init() {
    this.setCanvas();
    this.setCamera();
    this.render();
  }

  render() {
    if (!this.camera) return;

    window.addEventListener("load", () => {
      this.images.forEach((image) => {
        const mesh = this.setMesh(image);
        this.scene.add(mesh);
        this.setMeshPosition(image, mesh, 0);
        this.planeArray.push({ image, mesh });
      });
    });

    for (const plane of this.planeArray) {
      this.updateMesh(plane.image, plane.mesh, this.offset);
    }

    this.renderer?.render(this.scene, this.camera);
    requestAnimationFrame(this.render);
  }
}
