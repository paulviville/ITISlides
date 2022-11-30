import Slide from './Slide.js';

import * as THREE from '../CMapJS/Libs/three.module.js';
import {OrbitControls} from '../CMapJS/Libs/OrbitsControls.js';
import Renderer from '../CMapJS/Rendering/Renderer.js';
import * as Display from '../CMapJS/Utils/Display.js';
import * as Lung from '../Files/lung_files.js';
import {loadCMap2} from '../CMapJS/IO/SurfaceFormats/CMap2IO.js';
import {loadGraph} from '../CMapJS/IO/GraphFormats/GraphIO.js';
import {loadIncidenceGraph} from '../CMapJS/IO/IncidenceGraphFormats/IncidenceGraphIO.js';
import {Clock} from '../CMapJS/Libs/three.module.js';
import * as Lung0 from '../Files/anim0_files.js';
import * as Lung1 from '../Files/anim1_files.js';
import * as Lung2 from '../Files/anim2_files.js';
import * as Lung3 from '../Files/anim3_files.js';
import {glRenderer, scafEdgeMaterial, meshEdgeMaterial, ambiantLightInt, pointLightInt} from './parameters.js';


export const slide_medical0 = new Slide(
	function(DOM_hexmesh)
	{
		this.camera = new THREE.PerspectiveCamera(45, DOM_hexmesh.width / DOM_hexmesh.height, 0.1, 1000.0);
		this.camera.position.set(0, -1, 8.5);
		
		const surfaceLayer = 0;
		const meshLayer = 1;

		const contextInput = DOM_hexmesh.getContext('2d');

		const orbitControlsInput = new OrbitControls(this.camera, DOM_hexmesh);

		this.scene = new THREE.Scene()
		const ambiantLight = new THREE.AmbientLight(0xFFFFFF, ambiantLightInt);
		const pointLight = new THREE.PointLight(0xFFFFFF, pointLightInt);
		pointLight.position.set(10,8,15);

		ambiantLight.layers.enable(surfaceLayer);
		pointLight.layers.enable(surfaceLayer);
		ambiantLight.layers.enable(meshLayer);
		pointLight.layers.enable(meshLayer);

		this.scene.add(pointLight);
		this.scene.add(ambiantLight);

		this.group = new THREE.Group;
		this.scene.add(this.group);

		this.lungVol = Display.loadVolumesView("mesh", Lung.lung_mesh, {axis: (new THREE.Vector3(0, 0, 1))});
		this.lungVol.layers.set(meshLayer);
		this.group.add(this.lungVol);


		// this.lungSkel.faces.create({layer: surfaceLayer, side: THREE.DoubleSide}).addTo(this.group);

		// const scale = 0.0075;
		// const offset = -0.36;
		// this.lungSurface.scale.set(scale,scale,scale);
		// this.lungSurface.position.set(0,0, offset);
		// // this.lungSkel.edges.mesh.scale.set(scale,scale,scale);
		// // this.lungSkel.edges.mesh.position.set(0,0,offset);
		// // this.lungSkel.faces.mesh.scale.set(scale,scale,scale);
		// // this.lungSkel.faces.mesh.position.set(0,0,offset);
		// this.lungVol.scale.set(scale,scale,scale);
		this.lungVol.position.set(0,1,0);
		this.lungVol.material.uniforms.quality.value = 1;

		const axis = new THREE.Vector3(0, 1, 0);
		this.clock = new Clock(true);
		this.time = 0;
		
		this.toggleClipping = function(){
			this.lungVol.material.uniforms.clipping.value = 1 - this.lungVol.material.uniforms.clipping.value;
		};
		// this.toggleClipping();
		this.toggleVisible = function(){
			this.lungVol.visible = !this.lungVol.visible;
		};

		this.on = 1;
		this.pause = function(){
			this.on = 1 - this.on;
		};

		// this.lungScaf.edges.mesh.position.set(-0.00825,-0.0025,0)
		// this.lungSkel.edges.mesh.position.set(0.00905,0.0040185,0)
		// this.lungSurface.position.set(0.005,0.0035,0)
		// this.lungVol.position.set(0.0125,0.0065,0)

		this.loop = function(){
			if(this.running){
				glRenderer.setSize(DOM_hexmesh.width, DOM_hexmesh.height);
				this.time += this.clock.getDelta() * this.on;
				this.group.setRotationFromAxisAngle(axis, 1+Math.PI / 90 * this.time);

				this.camera.layers.enable(meshLayer);
				glRenderer.render(this.scene, this.camera);
				contextInput.clearRect(0, 0, DOM_hexmesh.width, DOM_hexmesh.height);
				contextInput.drawImage(glRenderer.domElement, 0, 0)
				this.camera.layers.disable(meshLayer);

				requestAnimationFrame(this.loop.bind(this));
			}
		}
	});