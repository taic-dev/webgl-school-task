import * as THREE from "three";
import { PARAMS } from "./params";
import vertexShader from "../shader/vertexShader.glsl";
import fragmentShader from "../shader/fragmentShader.glsl";

export class Webgl {
  [x: string]: any;

  constructor() {
    this.renderer = null;
    this.camera;
    this.scene;
    this.geometry;
    this.material;

    this.imgArray = document.querySelectorAll(".gallery-item img");
    this.planeArray = []

    this.render = this.render.bind(this);
  }

  createMesh(img: HTMLImageElement) {
    this.geometry = new THREE.PlaneGeometry(
      PARAMS.PLANE_GEOMETRY.X,
      PARAMS.PLANE_GEOMETRY.Y,
      PARAMS.PLANE_GEOMETRY.W_SEGMENTS,
      PARAMS.PLANE_GEOMETRY.Y_SEGMENTS
    );

    const loader = new THREE.TextureLoader();
    const texture = loader.load(img.src);

    this.uniforms = {
      uTexture: { value: texture },
      uImageAspect: { value: img.naturalWidth / img.naturalHeight },
      uPlaneAspect: { value: img.clientWidth / img.clientHeight },
    };

    this.material = new THREE.ShaderMaterial({
      uniforms: this.uniforms,
      vertexShader,
      fragmentShader,
    });

    this.mesh = new THREE.Mesh(this.geometry, this.material);
    return this.mesh;
  }

  setImagePlane(img: HTMLImageElement, mesh: THREE.Mesh) {
    const rect = img.getBoundingClientRect()
    mesh.scale.x = rect.width;
    mesh.scale.y = rect.height;

    const x = rect.left - PARAMS.WINDOW.W / 2 + rect.width / 2;
    const y = -rect.top + PARAMS.WINDOW.H / 2 - rect.height / 2;

    console.log(x, y)
    
    mesh.position.set(x, y, mesh.position.z);
  }

  updateImagePlane(img: HTMLImageElement, mesh: THREE.Mesh) {
    this.setImagePlane(img, mesh);

  }

  init() {
    this.renderer = new THREE.WebGLRenderer({ alpha: true });
    this.renderer.setPixelRatio(PARAMS.WINDOW.PIXEL_RATIO);
    this.renderer.setSize(PARAMS.WINDOW.W, PARAMS.WINDOW.H);

    const webglDom = document.querySelector(".webgl");
    webglDom?.appendChild(this.renderer.domElement);

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

    this.scene = new THREE.Scene();
  }

  render() {
    window.addEventListener("load", () => {
      for (const img of this.imgArray) {
        const mesh = this.createMesh(img);
        this.scene.add(mesh);
        this.setImagePlane(img, mesh);

        this.planeArray.push({img, mesh})
      }
    });

    for(const plane of this.planeArray) {
      this.updateImagePlane(plane.img, plane.mesh);
    }

    this.renderer.render(this.scene, this.camera);
    requestAnimationFrame(this.render);
  }
}
