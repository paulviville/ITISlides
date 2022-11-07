import Slide from './Slide.js';

import * as THREE from '../CMapJS/Libs/three.module.js';
import {OrbitControls} from '../CMapJS/Libs/OrbitsControls.js';
import Renderer from '../CMapJS/Rendering/Renderer.js';
import * as Display from '../CMapJS/Utils/Display.js';
import * as Metatron from '../Files/metatron_files.js';
import * as Dino from '../Files/santa_files.js';
import * as Holes from '../Files/holes_files.js';
import {loadGraph} from '../CMapJS/IO/GraphFormats/GraphIO.js';
import {loadIncidenceGraph} from '../CMapJS/IO/IncidenceGraphFormats/IncidenceGraphIO.js';
import {Clock} from '../CMapJS/Libs/three.module.js';

import {glRenderer, meshEdgeColor, meshEdgeMaterial, ambiantLightInt, pointLightInt} from './parameters.js';


export const slide_results2 = new Slide(
	function(DOM_metatron, DOM_dino)
	{
		this.camera0 = new THREE.PerspectiveCamera(75, DOM_metatron.width / DOM_metatron.height, 0.1, 1000.0);
		this.camera0.position.set(0, 0, 0.7);
		this.camera1 = new THREE.PerspectiveCamera(75, DOM_dino.width / DOM_dino.height, 0.1, 1000.0);
		this.camera1.position.set(0, 0, 1);
		
		const dinoLayer = 1;
		const metatronLayer = 2;

		const context_input = DOM_metatron.getContext('2d');
		const context_output = DOM_dino.getContext('2d');

		const orbit_controls_input = new OrbitControls(this.camera0, DOM_metatron);
		const orbit_controls_output = new OrbitControls(this.camera1, DOM_dino);

		this.scene = new THREE.Scene()
		const ambiantLight = new THREE.AmbientLight(0xFFFFFF, ambiantLightInt);
		const pointLight = new THREE.PointLight(0xFFFFFF, pointLightInt);
		pointLight.position.set(10,8,15);

		ambiantLight.layers.enable(dinoLayer);
		pointLight.layers.enable(dinoLayer);
		ambiantLight.layers.enable(metatronLayer);
		pointLight.layers.enable(metatronLayer);

		this.scene.add(pointLight);
		this.scene.add(ambiantLight);

		this.group = new THREE.Group;
		this.scene.add(this.group);

		// this.metatron_surface = Display.loadSurfaceView("off", Metatron.metatron_off, {transparent: true, opacity: 0.3});
		// this.metatron_surface.layers.set(metatronLayer);
		// this.group.add(this.metatron_surface);

		// this.dino_surface = Display.loadSurfaceView("off", Dino.santa_off, {transparent: true, opacity: 0.3});
		// this.dino_surface.layers.set(dinoLayer);
		// this.group.add(this.dino_surface);

		// const dino_skel = loadIncidenceGraph('ig', Dino.santa_ig);
		// this.dino_skel = new Renderer(dino_skel);
		// this.dino_skel.edges.create({layer: dinoLayer, material: meshEdgeMaterial}).addTo(this.group);

		// const metatron_skel = loadIncidenceGraph('ig', Metatron.metatron1D_ig);
		// this.metatron_skel = new Renderer(metatron_skel);
		// this.metatron_skel.edges.create({layer: metatronLayer, material: meshEdgeMaterial, size: 80}).addTo(this.group);


		this.dino_vol = Display.loadVolumesView("mesh", Dino.santa_mesh);
		this.dino_vol.layers.set(dinoLayer);
		this.dino_vol.position.set(0, 0, -0.2);
		this.group.add(this.dino_vol);

		this.metatron_vol = Display.loadVolumesView("mesh", Metatron.metatron_mesh);
		this.metatron_vol.layers.set(metatronLayer);
		this.group.add(this.metatron_vol);

		const axis = new THREE.Vector3(0, 1, 0);
		this.clock = new Clock(true);
		this.time = 0;
		
		this.toggle_clipping = function(){
			this.dino_vol.material.uniforms.clipping.value = 1 - this.dino_vol.material.uniforms.clipping.value;
			this.metatron_vol.material.uniforms.clipping.value = 1 - this.metatron_vol.material.uniforms.clipping.value;
		};

		// this.toggle_visible = function(){
		// 	this.dino_vol.visible = !this.dino_vol.visible;
		// 	this.metatron_vol.visible = !this.metatron_vol.visible;
		// 	this.dino_skel.edges.mesh.visible = !this.dino_skel.edges.mesh.visible;
		// 	this.metatron_skel.edges.mesh.visible = !this.metatron_skel.edges.mesh.visible;
		// };

		this.toggle_material = function(){
			this.dino_vol.material.uniforms.quality.value = 1 - this.dino_vol.material.uniforms.quality.value;
			this.metatron_vol.material.uniforms.quality.value = 1 - this.metatron_vol.material.uniforms.quality.value;
		}


		this.on = 1;
		this.pause = function(){
			this.on = 1 - this.on;
		};


		const scale = 0.0075;
		const offset = -0.36;
		// this.metatron_surface.scale.set(scale,scale,scale);
		// this.metatron_surface.position.set(0,0, offset);
		// this.metatron_skel.edges.mesh.scale.set(scale,scale,scale);
		// this.metatron_skel.edges.mesh.position.set(0,0,offset);
		this.metatron_vol.scale.set(0.385,0.385,0.385);
		this.metatron_vol.position.set(0,0,0.02);

		// this.metatron_vol.visible = false ;
		// this.dilo_vol.visible = false;
		// this.dilo_surface.visible = true;
		// this.metatron_skel.edges.mesh.visible = true;
		// this.dilo_skel.edges.mesh.visible = true;
		// this.dilo_surface.material.side = THREE.BackSide;
		// this.metatron_surface.material.side = THREE.BackSide;


		this.loop = function(){
			if(this.running){
				this.time += this.clock.getDelta() * this.on;
				this.group.setRotationFromAxisAngle(axis, Math.PI / 90 * this.time);

				this.camera0.layers.enable(metatronLayer);
				glRenderer.setSize(DOM_metatron.width, DOM_metatron.height);
				glRenderer.render(this.scene, this.camera0);
				context_input.clearRect(0, 0, DOM_metatron.width, DOM_metatron.height);
				context_input.drawImage(glRenderer.domElement, 0, 0)
				this.camera0.layers.disable(metatronLayer);

				this.camera1.layers.enable(dinoLayer);
				glRenderer.setSize(DOM_dino.width, DOM_dino.height);
				glRenderer.render(this.scene, this.camera1);
				context_output.clearRect(0, 0, DOM_dino.width, DOM_dino.height);
				context_output.drawImage(glRenderer.domElement, 0, 0);
				this.camera1.layers.disable(dinoLayer);

				requestAnimationFrame(this.loop.bind(this));
			}
		}
	});