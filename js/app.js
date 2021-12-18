import * as THREE from "three";
import vertexShader from "./shaders/vertexShader.glsl";
import fragmentShader from "./shaders/fragmentShader.glsl";
import { CubeUVReflectionMapping } from "three";
// console.log(THREE);
// console.log(document.body.getBoundingClientRect().height); //999とか

const scrollable = document.querySelector(".srcollable");

let current = 0;
let target = 0;
let ease = 0.075;

//線形補間、スムーズなスクロールをするため
function lerp(start, end, t) {
  return start * (1 - t) + end * t;
}

// console.log(lerp(10, 20, 0.5));

function init() {
  document.body.style.height = `${scrollable.getBoundingClientRect().height}px`;
}

function smoothScroll() {
  target = window.scrollY;
  current = lerp(current, target, ease);
  scrollable.style.transform = `translate3d(0, ${-current}px, 0)`;
  requestAnimationFrame(smoothScroll);
}

class EffectCanvas {
  constructor() {
    this.container = document.querySelector("main");
    this.images = [...document.querySelectorAll("img")];
    this.meshItems = [];
    this.setupCamera();
    this.createMeshItems();
    this.render();
  }

  get viewport() {
    let width = innerWidth;
    let height = innerHeight;
    let aspectRatio = width / height;
    return {
      width,
      height,
      aspectRatio,
    };
  }

  setupCamera() {
    window.addEventListener("resize", this.onWindowResize.bind(this));

    this.scene = new THREE.Scene();

    let perspective = 1000;
    const fov =
      (180 * (2 * Math.atan(window.innerHeight / 2 / perspective))) / Math.PI; // see fov image for a picture breakdown of this fov setting.
    this.camera = new THREE.PerspectiveCamera(
      fov,
      this.viewport.aspectRatio,
      1,
      1000
    );
    this.camera.position.set(0, 0, perspective);

    this.renderer = new THREE.WebGL1Renderer({ antialias: true, alpha: true });
    this.renderer.setSize(this.viewport.width, this.viewport.height);
    this.renderer.setPixelRatio(window.devicePixelRatio);
    this.container.appendChild(this.renderer.domElement);
  }

  onWindowResize() {
    init();
    this.camera.aspect = this.viewport.aspectRatio;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(this.viewport.width, this.viewport.height);
  }

  createMeshItems() {
    this.images.forEach((image) => {
      let meshItem = new MeshItem(image, this.scene);
      this.meshItems.push(meshItem);
    });
  }

  render() {
    smoothScroll();
    for (let i = 0; i < this.meshItems; i++) {
      this.meshItem[i].render();
    }
    this.renderer.render(this.scene, this.camera);
    requestAnimationFrame(this.render.bind(this));
  }
}

class MeshItem {
  // Pass in the scene as we will be adding meshes to this scene.
  constructor(element, scene) {
    this.element = element;
    this.scene = scene;
    this.offset = new THREE.Vector2(0, 0); // Positions of mesh on screen. Will be updated below.
    this.sizes = new THREE.Vector2(0, 0); //Size of mesh on screen. Will be updated below.
    this.createMesh();
  }

  getDimensions() {
    const { width, height, top, left } = this.element.getBoundingClientRect();
    this.sizes.set(width, height);
    this.offset.set(
      left - window.innerWidth / 2 + width / 2,
      -top + window.innerHeight / 2 - height / 2
    ); //?????????
  }

  createMesh() {
    this.geometry = new THREE.PlaneGeometry(1, 1, 30, 30);
    this.imageTexture = new THREE.TextureLoader().load(this.element.src);
    this.uniforms = {
      uTextures: {
        //texture data
        value: this.imageTexture,
      },
      uOffset: {
        value: new THREE.Vector2(0, 0),
      },
      uAlpha: {
        //opacity
        value: 1,
      },
    };
    this.material = new THREE.ShaderMaterial({
      uniforms: this.uniforms,
      vertexShader: vertexShader,
      fragmentShader: fragmentShader,
    });
    this.mesh = new THREE.Mesh(this.geometry, this.material);
    this.getDimensions();
    this.mesh.position.set(this.offset.x, this.offset.y, 0);
    this.mesh.scale.set(this.sizes.x, this.sizes.y, 0);
  }

  render() {
    // repeatidly called
    this.getDimensions();
    this.mesh.position.set(this.offset.x, this.offset.y, 0);
    this.mesh.scale.set(this.sizes.x, this.sizes.y, 0);
    this.uniforms.uOffset.value.set(0, -(target - current) * 0.0002); //??????
  }
}

init();

smoothScroll();
new EffectCanvas();
