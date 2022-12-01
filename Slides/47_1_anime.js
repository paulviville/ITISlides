import Slide from './Slide.js';

import * as THREE from '../CMapJS/Libs/three.module.js';
import {OrbitControls} from '../CMapJS/Libs/OrbitsControls.js';
import Renderer from '../CMapJS/Rendering/Renderer.js';
import * as Display from '../CMapJS/Utils/Display.js';
import * as Vessels from '../Files/vessels_files.js';
import * as Lung from '../Files/anim_files.js';
import * as Morph from '../Files/morph_files.js';
import * as Lung0 from '../Files/anim0_files.js';
import * as Lung1 from '../Files/anim1_files.js';
import * as Lung2 from '../Files/anim2_files.js';
import * as Lung3 from '../Files/anim3_files.js';
import {loadCMap2} from '../CMapJS/IO/SurfaceFormats/CMap2IO.js';
import {loadGraph} from '../CMapJS/IO/GraphFormats/GraphIO.js';
import {loadIncidenceGraph} from '../CMapJS/IO/IncidenceGraphFormats/IncidenceGraphIO.js';
import {Clock} from '../CMapJS/Libs/three.module.js';

import {glRenderer, scafEdgeMaterial, meshEdgeMaterial, ambiantLightInt, pointLightInt} from './parameters.js';

import {geometryFromStr as volumesGeometryFromStr} from '../CMapJS/IO/VolumesFormats/CMap3IO.js';

const mesh_color = new THREE.Color(0x60c3f4);

export const slide_anime2 = new Slide(
	function(DOM_0, DOM_1, DOM_2, DOM_3)
	{
		this.camera = new THREE.PerspectiveCamera(45, DOM_0.width / DOM_0.height, 0.1, 1000.0);
		this.camera.position.set(0, 0,15);
		
		const layer0 = 0;
		const layer1 = 1;
		const layer2 = 2;
		const layer3 = 3;
		const layerEnd = 4;
		const layerStart = 5;

		const context0 = DOM_0.getContext('2d');
		const context1 = DOM_1.getContext('2d');
		const context2 = DOM_2.getContext('2d');
		const context3 = DOM_3.getContext('2d');

		const orbitControls0 = new OrbitControls(this.camera, DOM_0);
		const orbitControls1 = new OrbitControls(this.camera, DOM_1);
		const orbitControls2 = new OrbitControls(this.camera, DOM_2);
		const orbitControls3 = new OrbitControls(this.camera, DOM_3);

		this.scene = new THREE.Scene()
		const ambiantLight = new THREE.AmbientLight(0xFFFFFF, ambiantLightInt);
		const pointLight = new THREE.PointLight(0xFFFFFF, pointLightInt);
		pointLight.position.set(10,8,15);

		ambiantLight.layers.enable(layer0);
		pointLight.layers.enable(layer0);
		ambiantLight.layers.enable(layer1);
		pointLight.layers.enable(layer1);
		ambiantLight.layers.enable(layer2);
		pointLight.layers.enable(layer2);
		ambiantLight.layers.enable(layer3);
		pointLight.layers.enable(layer3);
		ambiantLight.layers.enable(layerEnd);
		pointLight.layers.enable(layerEnd);
		ambiantLight.layers.enable(layerStart);
		pointLight.layers.enable(layerStart);

		this.scene.add(pointLight);
		this.scene.add(ambiantLight);

		this.group = new THREE.Group;
		this.scene.add(this.group);

		// this.vesselsVol = loadAnim();
		// this.vesselsVol.layers.set(layer3);
		// this.group.add(this.vesselsVol);

		this.vesselsSurf0 = Display.loadSurfaceView("off", Lung.lung0_off, {transparent: true, opacity: 0.1, color: new THREE.Color(0xFF0000)});
		this.vesselsSurf0.layers.set(layerStart);
		this.group.add(this.vesselsSurf0);

		// this.vesselsSurf1 = Display.loadSurfaceView("off", Lung.lung1_off, {transparent: true, opacity: 0.1, color: new THREE.Color(0xFF0000)});
		// this.vesselsSurf1.layers.set(layer3);
		// this.group.add(this.vesselsSurf1);

		// this.vesselsSurf2 = Display.loadSurfaceView("off", Lung.lung2_off, {transparent: true, opacity: 0.1, color: new THREE.Color(0x00FF00)});
		// this.vesselsSurf2.layers.set(layer3);
		// this.group.add(this.vesselsSurf2);

		this.vesselsSurf3 = Display.loadSurfaceView("off", Lung.lung1_off, {transparent: true, opacity: 0.1, color: new THREE.Color(0x0000FF)});
		this.vesselsSurf3.layers.set(layerEnd);
		this.group.add(this.vesselsSurf3);

		this.lungVol = Display.loadVolumesView("mesh", Lung0.lung0_mesh);
		this.lungVol.layers.set(layer0);
		this.group.add(this.lungVol);

		this.lungVol1 = Display.loadVolumesView("mesh", Lung1.lung1_mesh);
		this.lungVol1.layers.set(layer3);
		this.group.add(this.lungVol1);

		this.lungVolR = Display.loadVolumesView("mesh", Morph.lung_rigid_mesh);
		this.lungVolR.layers.set(layer1);
		this.group.add(this.lungVolR);

		this.lungVolE = Display.loadVolumesView("mesh", Morph.lung_elastic_mesh);
		this.lungVolE.layers.set(layer2);
		this.group.add(this.lungVolE);

		const axis = new THREE.Vector3(0, 1, 0);
		this.clock = new Clock(true);
		this.time = 0;
		
		this.toggleClipping = function(){
			this.vesselsVol.material.uniforms.clipping.value = 1 - this.vesselsVol.material.uniforms.clipping.value;
		};
		// this.toggleClipping();
		// this.toggleVisible = function(){
		// 	this.vesselsVol.visible = !this.vesselsVol.visible;
		// };
		// this.toggleVisible();

		this.on = 1;
		this.pause = function(){
			this.on = 1 - this.on;
		};

		this.showMesh0 = function() {
			this.lungVol.visible = !this.lungVol.visible;
		}

		this.showMesh1 = function() {
			this.lungVolR.visible = !this.lungVolR.visible;
		}

		this.showMesh2 = function() {
			this.lungVolE.visible = !this.lungVolE.visible;
		}

		this.showMesh3 = function() {
			this.lungVol1.visible = !this.lungVol1.visible;
		}

		this.showsurf1 = function() {
			this.vesselsSurf3.visible = !this.vesselsSurf3.visible;
		}

		this.showMesh0();
		this.showMesh1();
		this.showMesh2();
		this.showMesh3();
		this.showsurf1();

		this.lungVol.position.set(0,8,0)
		this.lungVol.setRotationFromAxisAngle(new THREE.Vector3(1, 0, 0), -Math.PI/2)
		this.lungVolE.position.set(0,8,0)
		this.lungVolE.setRotationFromAxisAngle(new THREE.Vector3(1, 0, 0), -Math.PI/2)
		this.lungVolR.position.set(0,8,0)
		this.lungVolR.setRotationFromAxisAngle(new THREE.Vector3(1, 0, 0), -Math.PI/2)
		this.lungVol1.position.set(0,8,0)
		this.lungVol1.setRotationFromAxisAngle(new THREE.Vector3(1, 0, 0), -Math.PI/2)
		this.vesselsSurf0.position.set(0,8,0)
		this.vesselsSurf0.setRotationFromAxisAngle(new THREE.Vector3(1, 0, 0), -Math.PI/2)

		this.vesselsSurf3.position.set(0,8,0)
		this.vesselsSurf3.setRotationFromAxisAngle(new THREE.Vector3(1, 0, 0), -Math.PI/2)

		this.vesselsSurf0.material.side = THREE.BackSide;
		this.vesselsSurf3.material.side = THREE.BackSide;

		this.loop = function(){
			if(this.running){
				glRenderer.setSize(DOM_0.width, DOM_0.height);
				this.time += this.clock.getDelta() * this.on;
				// this.vesselsVol.material.uniforms.timer.value = (1+Math.sin(this.time*0.6))/2;

				this.camera.layers.enable(layerStart);
				this.camera.layers.enable(layer0);
				glRenderer.render(this.scene, this.camera);
				context0.clearRect(0, 0, DOM_0.width, DOM_0.height);
				context0.drawImage(glRenderer.domElement, 0, 0)
				this.camera.layers.disable(layer0);


				this.camera.layers.enable(layerEnd);
				this.camera.layers.enable(layer1);
				glRenderer.render(this.scene, this.camera);
				context1.clearRect(0, 0, DOM_1.width, DOM_1.height);
				context1.drawImage(glRenderer.domElement, 0, 0);
				this.camera.layers.disable(layer1);
				this.camera.layers.disable(layerStart);

				this.camera.layers.enable(layer2);
				glRenderer.render(this.scene, this.camera);
				context2.clearRect(0, 0, DOM_2.width, DOM_2.height);
				context2.drawImage(glRenderer.domElement, 0, 0);
				this.camera.layers.disable(layer2);

				this.camera.layers.enable(layer3);
				glRenderer.render(this.scene, this.camera);
				context3.clearRect(0, 0, DOM_3.width, DOM_3.height);
				context3.drawImage(glRenderer.domElement, 0, 0);
				this.camera.layers.disable(layer3);
				this.camera.layers.disable(layerEnd);

				requestAnimationFrame(this.loop.bind(this));
			}
		}
	});