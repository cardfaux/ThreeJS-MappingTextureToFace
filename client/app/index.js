/* eslint-disable quotes */
/* eslint-disable no-console */
/* eslint-disable no-unused-vars */
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
// import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { EXRLoader } from 'three/examples/jsm/loaders/EXRLoader';
import disp from '../assets/displacement.exr';
import normal from '../assets/normal.png';
import stickers from '../assets/stickers.png';

import fragment from './shaders/fragment.glsl';
import vertex from './shaders/vertex.glsl';
import * as dat from 'dat.gui';
import gsap from 'gsap';

export default class Sketch {
  constructor(options) {
    this.scene = new THREE.Scene();

    this.container = options.dom;
    this.width = this.container.offsetWidth;
    this.height = this.container.offsetHeight;
    this.renderer = new THREE.WebGLRenderer();
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.setSize(this.width, this.height);
    this.renderer.setClearColor(0xeeeeee, 1);
    this.renderer.physicallyCorrectLights = true;
    this.renderer.outputEncoding = THREE.sRGBEncoding;

    this.container.appendChild(this.renderer.domElement);

    this.camera = new THREE.PerspectiveCamera(70, window.innerWidth / window.innerHeight, 0.001, 1000);

    // var frustumSize = 10;
    // var aspect = window.innerWidth / window.innerHeight;
    // this.camera = new THREE.OrthographicCamera( frustumSize * aspect / - 2, frustumSize * aspect / 2, frustumSize / 2, frustumSize / - 2, -1000, 1000 );
    this.camera.position.set(0, 0, 2);
    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.time = 0;

    this.isPlaying = true;

    this.ambient = new THREE.AmbientLight(0xffffff, 0.95);
    this.directional = new THREE.DirectionalLight(0xffffff, 0.75);

    this.directional.position.set(0, 1, 1);

    this.scene.add(this.ambient);
    this.scene.add(this.directional);

    new EXRLoader().load(disp, (texture) => {
      this.displacementTexture = texture;
      this.addObjects();
      this.resize();
      this.render();
      this.setupResize();
      this.settings();
    });
  }

  settings() {
    let that = this;
    this.settings = {
      x: 0,
      y: 0,
    };
    this.gui = new dat.GUI();
    this.gui.add(this.settings, 'x', -2, 2, 0.01);
    this.gui.add(this.settings, 'y', -0.5, 0.5, 0.01);
  }

  setupResize() {
    window.addEventListener('resize', this.resize.bind(this));
  }

  resize() {
    this.width = this.container.offsetWidth;
    this.height = this.container.offsetHeight;
    this.renderer.setSize(this.width, this.height);
    this.camera.aspect = this.width / this.height;
    this.camera.updateProjectionMatrix();
  }

  addObjects() {
    let that = this;
    this.diffuse = new THREE.TextureLoader().load(stickers);
    this.material = new THREE.ShaderMaterial({
      extensions: {
        derivatives: '#extension GL_OES_standard_derivatives : enable',
      },
      side: THREE.DoubleSide,
      uniforms: {
        time: { value: 0 },
        resolution: { value: new THREE.Vector4() },
      },
      wireframe: true,
      // transparent: true,
      vertexShader: vertex,
      fragmentShader: fragment,
    });

    this.material1 = new THREE.MeshPhongMaterial({
      transparent: true,
      side: THREE.DoubleSide,
      normalMap: new THREE.TextureLoader().load(normal),
      displacementMap: this.displacementTexture,
      map: this.diffuse,
    });

    this.material1.onBeforeCompile = (shader) => {
      shader.uniforms.progress = { value: 0 };
      shader.uniforms.translate = { value: new THREE.Vector2(0, 0) };

      shader.vertexShader = shader.vertexShader.replace(
        `#include <clipping_planes_pars_vertex>`,

        `
        #include <clipping_planes_pars_vertex> 
        varying vec2 vDisplacementUV;
        uniform vec2 translate;
        vec2 rotate(vec2 v, float a) {
          float s = sin(a);
          float c = cos(a);
          mat2 m = mat2(c, -s, s, c);
          return m * v;
        }
        float map(float value, float min1, float max1, float min2, float max2) {
          return min2 + (value - min1) * (max2 - min2) / (max1 - min1);
        }
        `,
      );

      shader.vertexShader = shader.vertexShader.replace(
        `#include <project_vertex>`,

        `
        vec2 pos = position.xy * 0.5 * vec2(1., 4.) + vec2(0., 0.);

        float u = fract(pos.x + 0.5);
        float v = map(pos.y / 2., -1.5, 1.5, 0., 1.);

        vec2 displacementUV = vec2(u,v);

        vDisplacementUV = displacementUV;

        float displacement = (texture2D(displacementMap, displacementUV).r - 0.5) * 2.;

        float radius = 1.4 + 1.25 * displacement;

        vec2 rotatedDisplacement = rotate(vec2(0., radius), 2. * 3.1415 * (pos.x));

        //transformed.z += 0.4 * sin(10. * transformed.x);
        vec4 mvPosition = vec4(vec3(rotatedDisplacement.x, position.y, rotatedDisplacement.y), 1.0);
        
        mvPosition = modelViewMatrix * mvPosition; 
        gl_Position = projectionMatrix * mvPosition;`,
      );

      shader.fragmentShader = shader.fragmentShader.replace(
        `#include <common>`,
        `#include <common>
          varying vec2 vDisplacementUV;
        `,
      );

      shader.fragmentShader = shader.fragmentShader.replace(
        `#include <normal_fragment_maps>`,
        `#include <normal_fragment_maps>
          normal = texture2D(normalMap, vDisplacementUV).xyz * 2. - 1.;
        `,
      );

      this.material1.userData.shader = shader;
    };

    this.geometry = new THREE.PlaneGeometry(2, 2, 100, 100);

    this.plane = new THREE.Mesh(this.geometry, this.material);
    this.plane = new THREE.Mesh(this.geometry, this.material1);
    this.scene.add(this.plane);
  }

  stop() {
    this.isPlaying = false;
  }

  play() {
    if (!this.isPlaying) {
      this.render();
      this.isPlaying = true;
    }
  }

  render() {
    if (!this.isPlaying) return;
    this.time += 0.05;
    // this.material.uniforms.time.value = this.time;
    if (this.material1.userData.shader) {
      this.diffuse.offset.y = this.settings.y;
      this.diffuse.offset.x = this.settings.y;
      this.material1.userData.shader.uniforms.translate.value.x = this.settings.x;
      this.material1.userData.shader.uniforms.translate.value.y = this.settings.y;
    }
    requestAnimationFrame(this.render.bind(this));
    this.renderer.render(this.scene, this.camera);
  }
}

new Sketch({
  dom: document.getElementById('container'),
});
