import Slide from './Slide.js';

import * as THREE from '../CMapJS/Libs/three.module.js';
import {OrbitControls} from '../CMapJS/Libs/OrbitsControls.js';
import Renderer from '../CMapJS/Rendering/Renderer.js';
import * as Display from '../CMapJS/Utils/Display.js';
import * as Vessels from '../Files/vessels_files.js';
import {loadCMap2} from '../CMapJS/IO/SurfaceFormats/CMap2IO.js';
import {loadGraph} from '../CMapJS/IO/GraphFormats/GraphIO.js';
import {loadIncidenceGraph} from '../CMapJS/IO/IncidenceGraphFormats/IncidenceGraphIO.js';
import {Clock} from '../CMapJS/Libs/three.module.js';

import {glRenderer, scafEdgeMaterial, meshEdgeMaterial, ambiantLightInt, pointLightInt} from './parameters.js';


export const slide_results5 = new Slide(
	function(DOM_hexmesh)
	{
		this.camera = new THREE.PerspectiveCamera(75, DOM_hexmesh.width / DOM_hexmesh.height, 0.1, 1000.0);
		this.camera.position.set(0, 0, 0.9);
		
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

		this.vesselsSurface = Display.loadSurfaceView("off", Vessels.vessels_off, {transparent: true, opacity: 0.2});
		this.vesselsSurface.layers.set(surfaceLayer);
		this.group.add(this.vesselsSurface);

		this.vesselsVol = Display.loadVolumesView("mesh", Vessels.vessels_mesh);
		this.vesselsVol.layers.set(meshLayer);
		this.group.add(this.vesselsVol);

		const vesselsSkel = loadGraph('cg', Vessels.vessels_cg);
		this.vesselsSkel = new Renderer(vesselsSkel);
		this.vesselsSkel.edges.create({layer: surfaceLayer, material: meshEdgeMaterial}).addTo(this.group);

		const vesselsScaf = loadCMap2('off', Vessels.vessels_scaffold_off);
		this.vesselsScaf = new Renderer(vesselsScaf);
		this.vesselsScaf.edges.create({layer: surfaceLayer, material: scafEdgeMaterial, size: 0.75}).addTo(this.group);

		// this.vesselsSkel.faces.create({layer: surfaceLayer, side: THREE.DoubleSide}).addTo(this.group);

		// const scale = 0.0075;
		// const offset = -0.36;
		// this.vesselsSurface.scale.set(scale,scale,scale);
		// this.vesselsSurface.position.set(0,0, offset);
		// // this.vesselsSkel.edges.mesh.scale.set(scale,scale,scale);
		// // this.vesselsSkel.edges.mesh.position.set(0,0,offset);
		// // this.vesselsSkel.faces.mesh.scale.set(scale,scale,scale);
		// // this.vesselsSkel.faces.mesh.position.set(0,0,offset);
		// this.vesselsVol.scale.set(scale,scale,scale);
		// this.vesselsVol.position.set(0,0,offset);


		const axis = new THREE.Vector3(0, 1, 0);
		this.clock = new Clock(true);
		this.time = 0;
		
		this.toggleClipping = function(){
			this.vesselsVol.material.uniforms.clipping.value = 1 - this.vesselsVol.material.uniforms.clipping.value;
		};
		this.toggleClipping();
		this.toggleVisible = function(){
			this.vesselsVol.visible = !this.vesselsVol.visible;
		};

		this.on = 1;
		this.pause = function(){
			this.on = 1 - this.on;
		};

		this.vesselsScaf.edges.mesh.position.set(-0.00825,-0.0025,0)
		this.vesselsSkel.edges.mesh.position.set(0.00905,0.0040185,0)
		this.vesselsSurface.position.set(0.005,0.0035,0)
		// this.vesselsVol.position.set(0.0125,0.0065,0)

		this.loop = function(){
			if(this.running){
				glRenderer.setSize(DOM_hexmesh.width, DOM_hexmesh.height);
				this.time += this.clock.getDelta() * this.on;
				this.group.setRotationFromAxisAngle(axis, Math.PI / 50 * this.time);

				this.camera.layers.enable(surfaceLayer);
				this.camera.layers.enable(meshLayer);
				glRenderer.render(this.scene, this.camera);
				contextInput.clearRect(0, 0, DOM_hexmesh.width, DOM_hexmesh.height);
				contextInput.drawImage(glRenderer.domElement, 0, 0)
				this.camera.layers.disable(surfaceLayer);
				this.camera.layers.disable(meshLayer);

				requestAnimationFrame(this.loop.bind(this));
			}
		}
	});