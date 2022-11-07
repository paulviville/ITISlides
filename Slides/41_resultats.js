import Slide from './Slide.js';

import * as THREE from '../CMapJS/Libs/three.module.js';
import {OrbitControls} from '../CMapJS/Libs/OrbitsControls.js';
import Renderer from '../CMapJS/Rendering/Renderer.js';
import * as Display from '../CMapJS/Utils/Display.js';
import * as Horse from '../Files/horse_files.js';
import * as Dino from '../Files/dinopet_files.js';
import * as Holes from '../Files/holes_files.js';
import {loadGraph} from '../CMapJS/IO/GraphFormats/GraphIO.js';
import {loadIncidenceGraph} from '../CMapJS/IO/IncidenceGraphFormats/IncidenceGraphIO.js';
import {Clock} from '../CMapJS/Libs/three.module.js';

import {glRenderer, meshEdgeColor, meshEdgeMaterial, ambiantLightInt, pointLightInt} from './parameters.js';


export const slide_results1 = new Slide(
	function(DOM_horse, DOM_dino)
	{
		this.camera0 = new THREE.PerspectiveCamera(75, DOM_horse.width / DOM_horse.height, 0.1, 1000.0);
		this.camera0.position.set(0, 0.3, 0.85);
		this.camera1 = new THREE.PerspectiveCamera(75, DOM_dino.width / DOM_dino.height, 0.1, 1000.0);
		this.camera1.position.set(0, 0, 1.8);
		
		const dinoLayer = 1;
		const horseLayer = 2;

		const context_input = DOM_horse.getContext('2d');
		const context_output = DOM_dino.getContext('2d');

		const orbit_controls_input = new OrbitControls(this.camera0, DOM_horse);
		const orbit_controls_output = new OrbitControls(this.camera1, DOM_dino);

		this.scene = new THREE.Scene()
		const ambiantLight = new THREE.AmbientLight(0xFFFFFF, ambiantLightInt);
		const pointLight = new THREE.PointLight(0xFFFFFF, pointLightInt);
		pointLight.position.set(10,8,15);

		ambiantLight.layers.enable(dinoLayer);
		pointLight.layers.enable(dinoLayer);
		ambiantLight.layers.enable(horseLayer);
		pointLight.layers.enable(horseLayer);

		this.scene.add(pointLight);
		this.scene.add(ambiantLight);

		this.group = new THREE.Group;
		this.scene.add(this.group);

		this.horse_surface = Display.loadSurfaceView("off", Horse.horse_off, {transparent: true, opacity: 0.3});
		this.horse_surface.layers.set(horseLayer);
		this.group.add(this.horse_surface);

		this.dino_surface = Display.loadSurfaceView("off", Dino.dinopet_off, {transparent: true, opacity: 0.3});
		this.dino_surface.layers.set(dinoLayer);
		this.group.add(this.dino_surface);

		const dino_skel = loadIncidenceGraph('ig', Dino.dinopet_ig);
		this.dino_skel = new Renderer(dino_skel);
		this.dino_skel.edges.create({layer: dinoLayer, material: meshEdgeMaterial}).addTo(this.group);

		const horse_skel = loadGraph('cg', Horse.horse_cg);
		this.horse_skel = new Renderer(horse_skel);
		this.horse_skel.edges.create({layer: horseLayer, material: meshEdgeMaterial}).addTo(this.group);


		this.dino_vol = Display.loadVolumesView("mesh", Dino.dinopet_mesh);
		this.dino_vol.layers.set(dinoLayer);
		this.group.add(this.dino_vol);

		this.horse_vol = Display.loadVolumesView("mesh", Horse.horse_mesh);
		this.horse_vol.layers.set(horseLayer);
		this.group.add(this.horse_vol);

		const axis = new THREE.Vector3(0, 1, 0);
		this.clock = new Clock(true);
		this.time = 0;
		
		this.toggle_clipping = function(){
			this.dino_vol.material.uniforms.clipping.value = 1 - this.dino_vol.material.uniforms.clipping.value;
			this.horse_vol.material.uniforms.clipping.value = 1 - this.horse_vol.material.uniforms.clipping.value;
		};

		this.toggle_visible = function(){
			this.dino_vol.visible = !this.dino_vol.visible;
			this.horse_vol.visible = !this.horse_vol.visible;
			this.dino_skel.edges.mesh.visible = !this.dino_skel.edges.mesh.visible;
			this.horse_skel.edges.mesh.visible = !this.horse_skel.edges.mesh.visible;
		};

		this.toggle_material = function(){
			this.dino_vol.material.uniforms.quality.value = 1 - this.dino_vol.material.uniforms.quality.value;
			this.horse_vol.material.uniforms.quality.value = 1 - this.horse_vol.material.uniforms.quality.value;
		}


		this.on = 1;
		this.pause = function(){
			this.on = 1 - this.on;
		};


		const offsetAngledino = Math.PI/2;
		const offsetAxisdino = new THREE.Vector3(0, 1, 0);
		this.horse_surface.setRotationFromAxisAngle(offsetAxisdino, offsetAngledino);
		this.horse_vol.setRotationFromAxisAngle(offsetAxisdino, offsetAngledino);
		this.horse_skel.edges.mesh.setRotationFromAxisAngle(offsetAxisdino, offsetAngledino);

		this.dino_vol.visible = false ;
		this.horse_vol.visible = false;
		this.horse_surface.visible = true;
		this.dino_skel.edges.mesh.visible = true;
		this.horse_skel.edges.mesh.visible = true;
		this.horse_surface.material.side = THREE.BackSide;
		this.dino_surface.material.side = THREE.BackSide;

		this.loop = function(){
			if(this.running){
				this.time += this.clock.getDelta() * this.on;
				this.group.setRotationFromAxisAngle(axis, Math.PI / 90 * this.time);

				this.camera0.layers.enable(horseLayer);
				glRenderer.setSize(DOM_horse.width, DOM_horse.height);
				glRenderer.render(this.scene, this.camera0);
				context_input.clearRect(0, 0, DOM_horse.width, DOM_horse.height);
				context_input.drawImage(glRenderer.domElement, 0, 0)
				this.camera0.layers.disable(horseLayer);

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