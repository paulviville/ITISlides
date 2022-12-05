import Slide from './Slide.js';

import * as THREE from '../CMapJS/Libs/three.module.js';
import {OrbitControls} from '../CMapJS/Libs/OrbitsControls.js';
import Renderer from '../CMapJS/Rendering/Renderer.js';
import RendererSpherical from '../CMapJS/Rendering/RendererSpherical.js';
import * as Display from '../CMapJS/Utils/Display.js';
import * as SP from '../Files/sphere_partition_files.js';
import {loadGraph} from '../CMapJS/IO/GraphFormats/GraphIO.js';
import {loadCMap2} from '../CMapJS/IO/SurfaceFormats/CMap2IO.js';
import {Clock} from '../CMapJS/Libs/three.module.js';

import {glRenderer, scafEdgeMaterial, meshEdgeMaterial, ambiantLightInt, pointLightInt} from './parameters.js';

const sphere_mat = new THREE.MeshLambertMaterial({color: 0xEEEEEE, transparent: true, opacity: 0.50});
const sphere_geom = new THREE.SphereGeometry( 0.995, 64, 64 );
const cube_geom = new THREE.BoxGeometry( 0.7, 0.7, 0.7);
const cube_mat = new THREE.MeshLambertMaterial({color: 0xEEEEEE, transparent: true, opacity: 0.50});

const cylinder_geometry = new THREE.CylinderGeometry(0.0125, 0.0125, 1, 20);
const cylinder_material = new THREE.MeshBasicMaterial({
	color: new THREE.Color(0x333333),
});
const point_geom = new THREE.SphereGeometry( 0.05, 16, 16 );
const point_geom2 = new THREE.SphereGeometry( 0.18, 16, 16 );
const point_mat = new THREE.MeshLambertMaterial({color: 0xFF0000});
const point_mat2 = new THREE.MeshLambertMaterial({color: 0x0055DD});

function create_branching_point(graph, layer = 0, center_layer ){
	const vertex = graph.vertex;
	const edge = graph.edge;
	const position = graph.getAttribute(vertex, "position");
	const branching_point = new THREE.Group;
	const edges = new THREE.Group;
	graph.foreach(edge, ed => {
		let cylinder = new THREE.Mesh(cylinder_geometry, cylinder_material);
		cylinder.layers.set(center_layer == undefined? layer : center_layer);
		let p0 = position[graph.cell(vertex, ed)];
		let p1 = position[graph.cell(vertex, graph.alpha0[ed])];
		let dir = new THREE.Vector3().subVectors(p0, p1).multiplyScalar(1.2);

		let len = dir.length();
		let mid = new THREE.Vector3().addVectors(p0, p1).divideScalar(2);

		let dirx = new THREE.Vector3().crossVectors(dir.normalize(), new THREE.Vector3(-0.01,0.01,1).normalize());
		let dirz = new THREE.Vector3().crossVectors(dirx, dir);

		let m = new THREE.Matrix4().fromArray([
			dirx.x, dir.x, dirz.x, mid.x,
			dirx.y, dir.y, dirz.y, mid.y,
			dirx.z, dir.z, dirz.z, mid.z,
			0, 0, 0, 1]).transpose();
		cylinder.applyMatrix4(m);
		cylinder.scale.set(2, len, 2);
		edges.add(cylinder);
	});

	const points = new THREE.Group;
	graph.foreach(vertex, vd => {
		let point;
		let deg = 0;
		graph.foreachDartOf(vertex, vd, d => {++deg; });

		if(deg > 1){
			let center_point = new THREE.Mesh(point_geom2, point_mat2);
			center_point.position.copy(position[graph.cell(vertex, vd)]);
			center_point.layers.set(center_layer == undefined? layer : center_layer);
			branching_point.add(center_point);
		}
		else{
			point = new THREE.Mesh(point_geom, point_mat);

			point.position.copy(position[graph.cell(vertex, vd)]);
			point.layers.set(layer);
			points.add(point);
		}
		
	});

	branching_point.add(points);
	branching_point.add(edges);
	return branching_point;
}

export const slide_embranch = new Slide(
	function(DOM_3points, DOM_4points, DOM_5points){
		const base3_layer = 0;
		const base4_layer = 1;
		const partition_layer = 2;
		const sphere3_layer = 3;
		const sphere4_layer = 4;
		const sphere5_layer = 5;
		const points3_layer = 6;
		const flat_layer = 7;
		const points5_layer = 8;
		const ortho_layer = 9;
		const sphere_layer = 10;

		const context_points3 = DOM_3points.getContext('2d');
		const context_points4 = DOM_4points.getContext('2d');
		const context_points5 = DOM_5points.getContext('2d');

		this.camera = new THREE.PerspectiveCamera(45, DOM_3points.width / DOM_3points.height, 0.1, 1000.0);
		this.camera.position.set(0, 0.75, 3);

		const orbit_controls0  = new OrbitControls(this.camera, DOM_3points);
		const orbit_controls1  = new OrbitControls(this.camera, DOM_4points);
		const orbit_controls2  = new OrbitControls(this.camera, DOM_5points);

		this.scene = new THREE.Scene();
		let ambiantLight = new THREE.AmbientLight(0xFFFFFF, ambiantLightInt);
		let pointLight = new THREE.PointLight(0xFFFFFF, pointLightInt);
		pointLight.position.set(10,8,15);
		this.scene.add(ambiantLight);
		this.scene.add(pointLight);
		ambiantLight.layers.enable(base3_layer);
		pointLight.layers.enable(base3_layer);
		ambiantLight.layers.enable(base4_layer);
		pointLight.layers.enable(base4_layer);
		ambiantLight.layers.enable(ortho_layer);
		pointLight.layers.enable(ortho_layer);
		ambiantLight.layers.enable(sphere_layer);
		pointLight.layers.enable(sphere_layer);
		ambiantLight.layers.enable(sphere3_layer);
		pointLight.layers.enable(sphere3_layer);
		ambiantLight.layers.enable(sphere4_layer);
		pointLight.layers.enable(sphere4_layer);
		ambiantLight.layers.enable(sphere5_layer);
		pointLight.layers.enable(sphere5_layer);
		ambiantLight.layers.enable(points3_layer);
		pointLight.layers.enable(points3_layer);
		ambiantLight.layers.enable(flat_layer);
		pointLight.layers.enable(flat_layer);		
		ambiantLight.layers.enable(points5_layer);
		pointLight.layers.enable(points5_layer);
		this.group = new THREE.Group;
		this.scene.add(this.group);

		let sphere =  new THREE.Mesh(sphere_geom, sphere_mat);
		sphere.layers.set(sphere_layer);
		this.group.add(sphere);

		let cubes = new THREE.Group;
		let cube = new THREE.Mesh(cube_geom, cube_mat);
		cubes.add(cube);
		cube.layers.set(ortho_layer);
		cube.position.set(0.4, 0.4, 0.4)
		cube = new THREE.Mesh(cube_geom, cube_mat);
		cubes.add(cube);
		cube.layers.set(ortho_layer);
		cube.position.set(0.4, -0.4, 0.4)
		cube = new THREE.Mesh(cube_geom, cube_mat);
		cubes.add(cube);
		cube.layers.set(ortho_layer);
		cube.position.set(0.4, -0.4, -0.4)
		cube = new THREE.Mesh(cube_geom, cube_mat);
		cubes.add(cube);
		cube.layers.set(ortho_layer);
		cube.position.set(0.4, 0.4, -0.4)
		cube = new THREE.Mesh(cube_geom, cube_mat);
		cubes.add(cube);
		cube.layers.set(ortho_layer);
		cube.position.set(-0.4, 0.4, 0.4)
		cube = new THREE.Mesh(cube_geom, cube_mat);
		cubes.add(cube);
		cube.layers.set(ortho_layer);
		cube.position.set(-0.4, -0.4, 0.4)
		cube = new THREE.Mesh(cube_geom, cube_mat);
		cubes.add(cube);
		cube.layers.set(ortho_layer);
		cube.position.set(-0.4, -0.4, -0.4)
		cube = new THREE.Mesh(cube_geom, cube_mat);
		cubes.add(cube);
		cube.layers.set(ortho_layer);
		cube.position.set(-0.4, 0.4, -0.4)
		this.group.add(cubes);

		let points14_graph = loadGraph('cg', SP.partition_14_cg);
		let points14 = create_branching_point(points14_graph, partition_layer);
		this.group.add(points14);

		let points14_surface = loadCMap2('off', SP.partition_14_off);
		let points14_surface_renderer = new RendererSpherical(points14_surface);
		points14_surface_renderer.geodesics.create({layer: partition_layer, color: 0xFF2222}).addTo(this.group);
		points14_surface_renderer.vertices.create({size: 0.03125, layer: partition_layer, color: 0x2222FF}).addTo(this.group);



		let flat_4_graph = loadGraph('cg', SP.flat_4_cg);
		let points4 = create_branching_point(flat_4_graph, flat_layer, flat_layer);
		this.group.add(points4);

		let flat_4_surface = loadCMap2('off', SP.flat_4_off);
		let flat4_surface_renderer = new RendererSpherical(flat_4_surface);
		flat4_surface_renderer.geodesics.create({layer: flat_layer, color: 0xFF2222}).addTo(this.group);
		flat4_surface_renderer.vertices.create({size: 0.03125, layer: flat_layer, color: 0x2222FF}).addTo(this.group);


		let ortho_5_surface = loadCMap2('off', SP.ortho_5_off);
		let ortho5_surface_renderer = new RendererSpherical(ortho_5_surface);
		ortho5_surface_renderer.geodesics.create({layer: ortho_layer, color: 0xFF2222}).addTo(this.group);
		ortho5_surface_renderer.vertices.create({size: 0.03125, layer: ortho_layer, color: 0x2222FF}).addTo(this.group);

		let ortho_5_graph = loadGraph('cg', SP.ortho_5_cg);
		let points5 = create_branching_point(ortho_5_graph, ortho_layer);
		this.group.add(points5);

		let plane = new THREE.Mesh(
			new THREE.PlaneGeometry(1.3, 1.3, 1, 1),
			new THREE.MeshBasicMaterial({color: 0xff00aa, transparent: false, opacity: 0.3, side: THREE.DoubleSide})
		);
		plane.layers.set(flat_layer);
		// plane.setRotationFromAxisAngle(new THREE.Vector3(1, 0, 0), Math.PI / 2 * 1.175)
		// plane.position.y +=0.1
		plane.lookAt(new THREE.Vector3(-0.09312512080324223, 0.9474387681196301, 0.30608412657199213))
		this.group.add(plane)

		const axis = new THREE.Vector3(0, 1, 0);
		this.clock = new Clock(true);
		this.time = 0;
		this.show_base = false;
		this.show_spheres = false;
		this.show_surfaces = false;
		this.toggle_base = function(){this.show_base = !this.show_base}
		this.toggle_spheres = function(){this.toggle_base(); this.show_spheres = !this.show_spheres}
		this.toggle_surfaces = function(){this.show_surfaces = !this.show_surfaces}
		
		this.loop = function(){
			if(this.running){
				this.time += this.clock.getDelta();
				this.group.setRotationFromAxisAngle(axis, Math.PI / 60 * this.time);


				this.camera.layers.enable(sphere_layer);
				if(this.show_base) this.camera.layers.enable(ortho_layer);
				
				this.camera.layers.enable(partition_layer);
				if(this.show_spheres) this.camera.layers.enable(sphere3_layer);
				if(this.show_surfaces) this.camera.layers.enable(points3_layer);
				glRenderer.setSize(DOM_3points.width, DOM_3points.height);
				glRenderer.render(this.scene, this.camera);
				context_points3.clearRect(0, 0, DOM_3points.width, DOM_3points.height);
				context_points3.drawImage(glRenderer.domElement, 0, 0);
				this.camera.layers.disable(points3_layer);
				this.camera.layers.disable(partition_layer);
				this.camera.layers.disable(sphere3_layer);

				this.camera.layers.enable(base4_layer);
				this.camera.layers.enable(flat_layer);
				if(this.show_spheres) this.camera.layers.enable(sphere4_layer);
				// if(this.show_surfaces) this.camera.layers.enable(flat_layer);
				glRenderer.render(this.scene, this.camera);
				context_points4.clearRect(0, 0, DOM_4points.width, DOM_4points.height);
				context_points4.drawImage(glRenderer.domElement, 0, 0);
				this.camera.layers.disable(flat_layer);
				this.camera.layers.disable(base4_layer);
				this.camera.layers.disable(sphere4_layer);
				this.camera.layers.disable(sphere_layer);

				this.camera.layers.enable(ortho_layer);
				if(this.show_spheres) this.camera.layers.enable(sphere5_layer);
				if(this.show_surfaces) this.camera.layers.enable(points5_layer);
				glRenderer.render(this.scene, this.camera);
				context_points5.clearRect(0, 0, DOM_5points.width, DOM_5points.height);
				context_points5.drawImage(glRenderer.domElement, 0, 0);
				this.camera.layers.disable(points5_layer);
				this.camera.layers.disable(ortho_layer);
				this.camera.layers.disable(sphere5_layer);

				this.camera.layers.disable(sphere_layer);
				this.camera.layers.disable(ortho_layer);

				requestAnimationFrame(this.loop.bind(this));
			}
		}

	}
);