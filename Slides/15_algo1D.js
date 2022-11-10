import Slide from './Slide.js';

import * as THREE from '../CMapJS/Libs/three.module.js';
import {OrbitControls} from '../CMapJS/Libs/OrbitsControls.js';
import Renderer from '../CMapJS/Rendering/Renderer.js';
import * as Display from '../CMapJS/Utils/Display.js';
import * as Cactus from '../Files/cactus_files.js';
import * as Horse from '../Files/horse_files.js';
import {loadGraph} from '../CMapJS/IO/GraphFormats/GraphIO.js';
import {loadIncidenceGraph} from '../CMapJS/IO/IncidenceGraphFormats/IncidenceGraphIO.js';
import {loadCMap2} from '../CMapJS/IO/SurfaceFormats/CMap2IO.js';
import {Clock} from '../CMapJS/Libs/three.module.js';

import {glRenderer, scafEdgeMaterial, meshEdgeMaterial, ambiantLightInt, pointLightInt} from './parameters.js';



export const slide_Algo1D = new Slide(
	function(DOM_Horse0, DOM_Horse1, DOM_Horse2, DOM_Horse3, DOM_Horse4)
	{
		this.camera = new THREE.PerspectiveCamera(45, DOM_Horse0.width / DOM_Horse0.height, 0.1, 1000.0);
		this.camera.position.set(0, 0.3, 0.85);

		const surfaceLayer = 0;
		const skelLayer = 1;
		const skelAdLayer = 2;
		const scafLayer = 3;
		const rawLayer = 4;
		const meshLayer = 6;

		const contextHorse0 = DOM_Horse0.getContext('2d');
		const contextHorse1 = DOM_Horse1.getContext('2d');
		const contextHorse2 = DOM_Horse2.getContext('2d');
		const contextHorse3 = DOM_Horse3.getContext('2d');
		const contextHorse4 = DOM_Horse4.getContext('2d');

		const controlsHorse0 = new OrbitControls(this.camera, DOM_Horse0);
		const controlsHorse1 = new OrbitControls(this.camera, DOM_Horse1);
		const controlsHorse2 = new OrbitControls(this.camera, DOM_Horse2);
		const controlsHorse3 = new OrbitControls(this.camera, DOM_Horse3);
		const controlsHorse4 = new OrbitControls(this.camera, DOM_Horse4);

		this.scene = new THREE.Scene()
		const ambiantLight = new THREE.AmbientLight(0xFFFFFF, ambiantLightInt);
		const pointLight = new THREE.PointLight(0xFFFFFF, pointLightInt);
		pointLight.position.set(10,8,15);

		ambiantLight.layers.enable(surfaceLayer);
		pointLight.layers.enable(surfaceLayer);
		ambiantLight.layers.enable(skelLayer);
		pointLight.layers.enable(skelLayer);
		ambiantLight.layers.enable(scafLayer);
		pointLight.layers.enable(scafLayer);
		ambiantLight.layers.enable(rawLayer);
		pointLight.layers.enable(rawLayer);
		ambiantLight.layers.enable(meshLayer);
		pointLight.layers.enable(meshLayer);

		this.scene.add(pointLight);
		this.scene.add(ambiantLight);

		this.group = new THREE.Group;
		this.scene.add(this.group);

		this.horseSurface = Display.loadSurfaceView("off", Horse.horse_off, {transparent: true, opacity: 0.3});
		this.horseSurface.layers.set(surfaceLayer);
		this.group.add(this.horseSurface);

		const horseSkel = loadIncidenceGraph('ig', Horse.horseRaw_ig);
		this.horseSkel = new Renderer(horseSkel);
		this.horseSkel.edges.create({layer: skelLayer, material: meshEdgeMaterial, size: 2}).addTo(this.group);

		const horseAdSkel = loadGraph('cg', Horse.horse_cg);
		this.horseAdSkel = new Renderer(horseAdSkel);
		this.horseAdSkel.edges.create({layer: skelAdLayer, material: meshEdgeMaterial, size: 2}).addTo(this.group);
		this.horseAdSkel.vertices.create({layer: skelAdLayer, size:0.01, color: new THREE.Color(0.2, 0.8, 0.2)}).addTo(this.group);


		const horseScaf = loadCMap2('off', Horse.horseScaf_off);
		this.horseScaf = new Renderer(horseScaf);
		this.horseScaf.edges.create({layer: scafLayer, material: scafEdgeMaterial, size: 2.5}).addTo(this.group);

		this.horseRawVol = Display.loadVolumesView("mesh", Horse.horseRaw_mesh);
		this.horseRawVol.layers.set(rawLayer);
		this.group.add(this.horseRawVol);

		this.horseVol = Display.loadVolumesView("mesh", Horse.horse_mesh);
		this.horseVol.layers.set(meshLayer);
		this.group.add(this.horseVol);

		const axis = new THREE.Vector3(0, 1, 0);
		this.clock = new Clock(true);
		this.time = 0;

		this.on = 1;
		this.pause = function(){
			this.on = 1 - this.on;
		};

		this.loop = function(){
			if(this.running){
				glRenderer.setSize(DOM_Horse0.width, DOM_Horse0.height);
				this.time += this.clock.getDelta() * this.on;
				this.group.setRotationFromAxisAngle(axis, Math.PI/2 + Math.PI / 50 * this.time);
				
				this.camera.layers.enable(skelLayer);
				glRenderer.render(this.scene, this.camera);
				contextHorse0.clearRect(0, 0, DOM_Horse0.width, DOM_Horse0.height);
				contextHorse0.drawImage(glRenderer.domElement, 0, 0);
				this.camera.layers.disable(skelLayer);

				this.camera.layers.enable(skelAdLayer);
				glRenderer.render(this.scene, this.camera);
				contextHorse1.clearRect(0, 0, DOM_Horse1.width, DOM_Horse1.height);
				contextHorse1.drawImage(glRenderer.domElement, 0, 0);

				this.camera.layers.enable(scafLayer);
				glRenderer.render(this.scene, this.camera);
				contextHorse2.clearRect(0, 0, DOM_Horse2.width, DOM_Horse2.height);
				contextHorse2.drawImage(glRenderer.domElement, 0, 0);
				this.camera.layers.disable(scafLayer);

				this.camera.layers.enable(rawLayer);
				glRenderer.render(this.scene, this.camera);
				contextHorse3.clearRect(0, 0, DOM_Horse3.width, DOM_Horse3.height);
				contextHorse3.drawImage(glRenderer.domElement, 0, 0);
				this.camera.layers.disable(rawLayer);
				this.camera.layers.disable(skelAdLayer);

				this.camera.layers.enable(meshLayer);
				glRenderer.render(this.scene, this.camera);
				contextHorse4.clearRect(0, 0, DOM_Horse4.width, DOM_Horse4.height);
				contextHorse4.drawImage(glRenderer.domElement, 0, 0);
				this.camera.layers.disable(meshLayer);

				requestAnimationFrame(this.loop.bind(this));
			}
		}
	});