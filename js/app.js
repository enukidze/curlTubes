import * as THREE from "three";
import fragment from "./shader/fragment.glsl";
import vertex from "./shader/vertex.glsl";

import fragment1 from "./shaderTubes/fragment.glsl";
import vertex1 from "./shaderTubes/vertex.glsl";

import {
  OrbitControls
} from 'three/examples/jsm/controls/OrbitControls.js';
import {
  createNoise3D
} from 'simplex-noise';


const noise3D = createNoise3D();


function computeCurl(x, y, z) {
  var eps = 0.0001;

  var curl = new THREE.Vector3();

  //Find rate of change in YZ plane
  var n1 = noise3D(x, y + eps, z);
  var n2 = noise3D(x, y - eps, z);
  //Average to find approximate derivative
  var a = (n1 - n2) / (2 * eps);
  var n1 = noise3D(x, y, z + eps);
  var n2 = noise3D(x, y, z - eps);
  //Average to find approximate derivative
  var b = (n1 - n2) / (2 * eps);
  curl.x = a - b;

  //Find rate of change in XZ plane
  n1 = noise3D(x, y, z + eps);
  n2 = noise3D(x, y, z - eps);
  a = (n1 - n2) / (2 * eps);
  n1 = noise3D(x + eps, y, z);
  n2 = noise3D(x - eps, y, z);
  b = (n1 - n2) / (2 * eps);
  curl.y = a - b;

  //Find rate of change in XY plane
  n1 = noise3D(x + eps, y, z);
  n2 = noise3D(x - eps, y, z);
  a = (n1 - n2) / (2 * eps);
  n1 = noise3D(x, y + eps, z);
  n2 = noise3D(x, y - eps, z);
  b = (n1 - n2) / (2 * eps);
  curl.z = a - b;

  return curl;
}


export default class Sketch {
  constructor(options) {
    this.scene = new THREE.Scene();
    this.scene1 = new THREE.Scene();
    

    this.container = options.dom;
    this.width = this.container.offsetWidth;
    this.height = this.container.offsetHeight;
    this.renderer = new THREE.WebGLRenderer();
    this.renderer.setPixelRatio(window.devicePixelRatio);
    this.renderer.setSize(this.width, this.height);
    this.renderer.setClearColor("black", 1);
    this.renderer.outputEncoding = THREE.sRGBEncoding;
    this.render.autoClear = false

    this.raycaster = new THREE.Raycaster();
    this.mouse = new THREE.Vector2();
    this.eMouse = new THREE.Vector2();
    this.elasticMouse = new THREE.Vector2(0,0);
    this.temp = new THREE.Vector2(0,0);
    this.elasticMouseVel = new THREE.Vector2(0,0);

    this.container.appendChild(this.renderer.domElement);

    this.camera = new THREE.PerspectiveCamera(
      70,
      window.innerWidth / window.innerHeight,
      0.001,
      1000
    );

    // var frustumSize = 10;
    // var aspect = window.innerWidth / window.innerHeight;
    // this.camera = new THREE.OrthographicCamera( frustumSize * aspect / - 2, frustumSize * aspect / 2, frustumSize / 2, frustumSize / - 2, -1000, 1000 );
    this.camera.position.set(0.3, 0.08, 2.1);
     this.camera.lookAt(0,0,0)
    //this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.time = 0;

    this.isPlaying = true;

    this.addObjects();
    this.rayCast()
    this.resize();
    this.render();
    this.setupResize();
    // this.settings();
  }

  rayCast() {
    this.raycastPlane = new THREE.Mesh(
      new THREE.PlaneBufferGeometry(200, 200),
      this.material,  
    )
    this.raycastPlane.position.set(0,0,0)
    this.scene.add(this.raycastPlane)

    this.light = new THREE.Mesh(
      new THREE.SphereBufferGeometry(0.02, 20, 20),
      new THREE.MeshBasicMaterial({
        color: 0xa8e6cf
      })
    )
    this.scene.add(this.light)

    this.container.addEventListener('mousemove', (event) => {
      this.mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
      this.mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
      
      this.raycaster.setFromCamera(this.mouse, this.camera );
      
      this.eMouse.x = event.clientX
      this.eMouse.y = event.clientY

      const intersects = this.raycaster.intersectObjects( [this.raycastPlane] );
      if(intersects.length>0){
        let p = intersects[0].point;
         // console.log(p);
        this.eMouse.x = p.x;
        this.eMouse.y = p.y

      }
    
    })
  
  
  }


  settings() {
    let that = this;
    this.settings = {
      progress: 0,
    };
    this.gui = new dat.GUI();
    this.gui.add(this.settings, "progress", 0, 1, 0.01);


  }

  setupResize() {
    window.addEventListener("resize", this.resize.bind(this));
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
    this.material = new THREE.ShaderMaterial({
      extensions: {
        derivatives: "#extension GL_OES_standard_derivatives : enable"
      },
      side: THREE.DoubleSide,
      uniforms: {
        time: {
          type: "f",
          value: 0
        },
        uLight: {
          value: new THREE.Vector3(0,0,0)
        },
        resolution: {
          type: "v4",
          value: new THREE.Vector4()
        },
        uvRate1: {
          value: new THREE.Vector2(1, 1)
        }
      },
      // wireframe: true,
      // transparent: true,
      vertexShader: vertex,
      fragmentShader: fragment
    });

    this.materialTubes = new THREE.ShaderMaterial({
      extensions: {
        derivatives: "#extension GL_OES_standard_derivatives : enable"
      },
      side: THREE.DoubleSide,
      uniforms: {
        time: {
          type: "f",
          value: 0
        },
        uLight: {
          value: new THREE.Vector3(0,0,0)
        },
        resolution: {
          type: "v4",
          value: new THREE.Vector4()
        },
        uvRate1: {
          value: new THREE.Vector2(1, 1)
        }
      },
      // wireframe: true,
      // transparent: true,
      vertexShader: vertex1,
      fragmentShader: fragment1
    });



    for (let i = 0; i < 200; i++) {
      
      let path = new THREE.CatmullRomCurve3(this.getCurve(
        new THREE.Vector3(
          Math.random() - 0.4,
          Math.random() - 0.4,
          Math.random()   
        )

      ))



      let geometry = new THREE.TubeGeometry(path, 600, 0.005, 8, false);
      let curve = new THREE.Mesh(geometry, this.materialTubes);
      this.scene.add(curve);
    }
  }

  getCurve(start) {
    let scale = 1
    let points = []


    points.push(start)
    let currentPoint = start.clone()



    for (let i = 0; i < 600; i++) {
      let v = computeCurl(currentPoint.x / scale, currentPoint.y / scale, currentPoint.z / scale);

      currentPoint.addScaledVector(v, 0.001)

      points.push(currentPoint.clone())
    }
    return points;
  }

  stop() {
    this.isPlaying = false;
  }

  play() {
    if (!this.isPlaying) {
      this.render()
      this.isPlaying = true;
    }
  }

  tick() {
  
    console.log(this.camera.position);
  }

  render() {
    if (!this.isPlaying) return;
    this.time += 0.05;

    
    
    this.temp.copy(this.eMouse).sub(this.elasticMouse).multiplyScalar(.15)
    this.elasticMouseVel.add(this.temp);
    this.elasticMouseVel.multiplyScalar(.8);
    this.elasticMouse.add(this.elasticMouseVel)
    this.light.position.x =  this.elasticMouse.x
    this.light.position.y =  this.elasticMouse.y

    this.material.uniforms.uLight.value = this.light.position
    this.materialTubes.uniforms.uLight.value = this.light.position
     
    
    this.material.uniforms.time.value = this.time;
    this.materialTubes.uniforms.time.value = this.time;
    
    requestAnimationFrame(this.render.bind(this));
    this.renderer.clear()
    this.renderer.render(this.scene1,this.camera)
    this.renderer.clearDepth()
    this.tick()
    this.renderer.render(this.scene, this.camera);
  }
}

new Sketch({
  dom: document.getElementById("container")
});