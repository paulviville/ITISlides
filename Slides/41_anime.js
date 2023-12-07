import Slide from './Slide.js';

import * as THREE from '../CMapJS/Libs/three.module.js';
import {OrbitControls} from '../CMapJS/Libs/OrbitsControls.js';
import Renderer from '../CMapJS/Rendering/Renderer.js';
import * as Display from '../CMapJS/Utils/Display.js';
import * as Vessels from '../Files/vessels_files.js';
import * as Lung from '../Files/anim_files.js';
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

let v_shader = `
in vec3 position;

uniform float timer;
uniform mat4 modelMatrix;
uniform mat4 modelViewMatrix;
uniform mat4 projectionMatrix;
uniform vec3 cameraPos;
uniform int clipping;
uniform int nbHex;
uniform float min_clipping;
uniform float max_clipping;
uniform vec3 mesh_color;
uniform float max_scale;

uniform sampler2D centerTexture;
uniform sampler2D positionTexture;

out vec3 pos;
out vec3 col;
out vec3 corner;

void main() {
	int i, j;
	vec3 center;
	vec3 p = position; // useless but firefox needs it
	if(timer < 0.3333) {
		i = gl_InstanceID % 800; j = gl_InstanceID / 800;
		vec3 center0 = texelFetch(centerTexture, ivec2(i, j), 0).xyz;
		i = (gl_InstanceID + nbHex) % 800; j = (gl_InstanceID + nbHex) / 800;
		vec3 center1 = texelFetch(centerTexture, ivec2(i, j), 0).xyz;
		center = mix(center0, center1, 3.*timer);

		i = (8*gl_InstanceID + gl_VertexID) % 800;
		j = (8*gl_InstanceID + gl_VertexID) / 800;
		vec3 p0 = texelFetch(positionTexture, ivec2(i, j), 0).xyz;
		i = (8*(gl_InstanceID + nbHex) + gl_VertexID) % 800;
		j = (8*(gl_InstanceID + nbHex) + gl_VertexID) / 800;
		vec3 p1 = texelFetch(positionTexture, ivec2(i, j), 0).xyz;
		p = mix(p0, p1, 3.*timer);

	} else if(timer < 0.6666) {
		i = (gl_InstanceID + nbHex) % 800; j = (gl_InstanceID + nbHex) / 800;
		vec3 center1 = texelFetch(centerTexture, ivec2(i, j), 0).xyz;
		i = (gl_InstanceID + nbHex*2) % 800; j = (gl_InstanceID + nbHex*2) / 800;
		vec3 center2 = texelFetch(centerTexture, ivec2(i, j), 0).xyz;
		center = mix(center1, center2, 3.*(timer-0.3333));

		i = (8*(gl_InstanceID + nbHex) + gl_VertexID) % 800;
		j = (8*(gl_InstanceID + nbHex) + gl_VertexID) / 800;
		vec3 p1 = texelFetch(positionTexture, ivec2(i, j), 0).xyz;
		i = (8*(gl_InstanceID + nbHex*2) + gl_VertexID) % 800;
		j = (8*(gl_InstanceID + nbHex*2) + gl_VertexID) / 800;
		vec3 p2 = texelFetch(positionTexture, ivec2(i, j), 0).xyz;
		p = mix(p1, p2, 3.*(timer-0.3333));
	} else {
		i = (gl_InstanceID + nbHex*2) % 800; j = (gl_InstanceID + nbHex*2) / 800;
		vec3 center2 = texelFetch(centerTexture, ivec2(i, j), 0).xyz;
		i = (gl_InstanceID + nbHex*3) % 800; j = (gl_InstanceID + nbHex*3) / 800;
		vec3 center3 = texelFetch(centerTexture, ivec2(i, j), 0).xyz;
		center = mix(center2, center3, 3.*(clamp(timer, 0.6666, 1.0)-0.6666));

		i = (8*(gl_InstanceID + nbHex*2) + gl_VertexID) % 800;
		j = (8*(gl_InstanceID + nbHex*2) + gl_VertexID) / 800;
		vec3 p2 = texelFetch(positionTexture, ivec2(i, j), 0).xyz;
		i = (8*(gl_InstanceID + nbHex*3) + gl_VertexID) % 800;
		j = (8*(gl_InstanceID + nbHex*3) + gl_VertexID) / 800;
		vec3 p3 = texelFetch(positionTexture, ivec2(i, j), 0).xyz;
		p = mix(p2, p3, 3.*(clamp(timer, 0.6666, 1.0) -0.6666));
	}
	
	vec3 plane = normalize(vec3(-1, 0, -2));
	float scale = max_scale;

	
	if(clipping == 1){
		vec3 c = vec3(modelMatrix * vec4(center, 1.0));
		float value = dot(plane, vec3(modelMatrix * vec4(center , 1.0)));
		value = clamp((value - min_clipping)/(max_clipping - min_clipping), 0.0, 1.0);
		scale *= (value);
		p = (p * scale) + center;
	}
	else
		p = (p * max_scale) + center;


	vec4 mvPosition = modelViewMatrix * vec4(p, 1.0);
	gl_Position = projectionMatrix * mvPosition;
	pos = vec3(modelMatrix * vec4( p, 1.0));
	col = mesh_color;
	corner = position;
}
`;

let f_shader = `
precision highp float;

in vec3 pos;
in vec3 col;
in vec3 corner;

out vec4 fragColor;

void main(){

	fragColor = vec4(1.0);
	float eps = 0.001;
	float width = 0.1;
	float x = 1.0-abs(corner.x);
	float y = 1.0-abs(corner.y);
	float z = 1.0-abs(corner.z);
	if(
		(x < eps && ( y < width || z < width)) ||
		(y < eps && ( x < width || z < width)) ||
		(z < eps && ( x < width || y < width))
	)
		fragColor *= vec4(vec3(0.3), 1.0);
	// else {

		vec3 light_pos = vec3(10.0, 8.0, 15.0);

		float specular = 0.3;
		float shine = 0.1;
		
		vec3 N = normalize(cross(dFdx(pos),dFdy(pos)));
		vec3 L = normalize(light_pos - pos);
		float lamb = clamp(dot(N, L), 0.2, 1.0);
		vec3 E = normalize(-pos);
		vec3 R = reflect(-L, N);
		float spec = pow(max(dot(R,E), 0.0), specular);
		vec3 specCol = mix(col, vec3(0.0), shine);
		fragColor *= vec4(mix(col * lamb, specCol, spec), 1.0);
	// }
}
`;


function loadAnim(){
	const g0 = volumesGeometryFromStr("mesh", Lung0.lung0_mesh);
	const g1 = volumesGeometryFromStr("mesh", Lung1.lung1_mesh);
	const g2 = volumesGeometryFromStr("mesh", Lung2.lung2_mesh);
	const g3 = volumesGeometryFromStr("mesh", Lung3.lung3_mesh);
	const nb_hex = g0.hex.length;

	let n = 0;
	const centers = new Float32Array(800*400 * 4);
	const positions = new Float32Array(800*1600*4);
	const P = [new THREE.Vector3, new THREE.Vector3, new THREE.Vector3, new THREE.Vector3,
		new THREE.Vector3, new THREE.Vector3, new THREE.Vector3, new THREE.Vector3
	];
	let center = new THREE.Vector3;

	for(let h = 0; h < g0.hex.length; h++){
		center.set(0, 0, 0);
		for(let i = 0; i < 8; ++i){
			P[i].fromArray(g0.v[g0.hex[h][i]])
			center.add(P[i]);
		}
		center.divideScalar(8);

		let m2 = 32*h;
		for(let i = 0; i < 8; ++i){
			positions[m2++] = P[i].x - center.x;
			positions[m2++] = P[i].y - center.y;
			positions[m2++] = P[i].z - center.z;
			positions[m2++] = 0;
		}

		n = 4*h;
		centers[n] = center.x;
		centers[n+1] = center.y;
		centers[n+2] = center.z;
		centers[n+3] = 0;

		n = 4*(nb_hex + h);
		center.set(0, 0, 0);
		for(let i = 0; i < 8; ++i){
			P[i].fromArray(g1.v[g1.hex[h][i]])
			center.add(P[i]);
		}
		center.divideScalar(8);

		m2 = 32*(nb_hex + h);
		for(let i = 0; i < 8; ++i){
			positions[m2++] = P[i].x - center.x;
			positions[m2++] = P[i].y - center.y;
			positions[m2++] = P[i].z - center.z;
			positions[m2++] = 0;
		}

		centers[n] = center.x;
		centers[n+1] = center.y;
		centers[n+2] = center.z;
		centers[n+3] = 0;

		n = 4*(2*nb_hex + h);
		center.set(0, 0, 0);
		for(let i = 0; i < 8; ++i){
			P[i].fromArray(g2.v[g2.hex[h][i]])
			center.add(P[i]);
		}
		center.divideScalar(8);

		m2 = 32*(2*nb_hex + h);
		for(let i = 0; i < 8; ++i){
			positions[m2++] = P[i].x - center.x;
			positions[m2++] = P[i].y - center.y;
			positions[m2++] = P[i].z - center.z;
			positions[m2++] = 0;
		}

		centers[n] = center.x;
		centers[n+1] = center.y;
		centers[n+2] = center.z;
		centers[n+3] = 0;

		n = 4*(3*nb_hex + h);
		center.set(0, 0, 0);
		for(let i = 0; i < 8; ++i){
			P[i].fromArray(g3.v[g3.hex[h][i]])
			center.add(P[i]);
		}
		center.divideScalar(8);

		m2 = 32*(3*nb_hex + h);
		for(let i = 0; i < 8; ++i){
			positions[m2++] = P[i].x - center.x;
			positions[m2++] = P[i].y - center.y;
			positions[m2++] = P[i].z - center.z;
			positions[m2++] = 0;
		}

		centers[n] = center.x;
		centers[n+1] = center.y;
		centers[n+2] = center.z;
		centers[n+3] = 0;
	}

	const centerTexture = new THREE.DataTexture(centers, 800, 400, THREE.RGBAFormat, THREE.FloatType);
	const positionTexture = new THREE.DataTexture(positions, 800, 1600, THREE.RGBAFormat, THREE.FloatType);

	const geometry = new THREE.BufferGeometry();
	const pos = [
		1.0, -1.0, -1.0,	-1.0, -1.0, -1.0,	-1.0, 1.0, -1.0,	1.0, 1.0, -1.0,
		1.0, -1.0, 1.0,		-1.0, -1.0, 1.0,	-1.0, 1.0, 1.0,		1.0, 1.0, 1.0
	]; // not actually used but here because firefox needs it
	const indices = [
		1, 0, 2,	2, 0, 3,	1, 5, 4,	1, 4, 0,
		0, 4, 3,	3, 4, 7,	3, 7, 6,	3, 6, 2, 
		1, 2, 5,	2, 6, 5,	5, 6, 4,	4, 6, 7	
	];

	geometry.setIndex(indices);
	geometry.setAttribute( 'position', new THREE.Float32BufferAttribute( pos, 3 ) );

	let material = new THREE.RawShaderMaterial( {
		glslVersion: THREE.GLSL3,
		vertexShader: v_shader,
		fragmentShader: f_shader,
		depthTest: true,
		depthWrite: true,
		uniforms: {
			clipping: {value: 0},
			min_clipping: {value: -0.01},
			max_clipping: {value: 0},
			quality: {value: 0},
			max_scale: {value: 0.90},
			mesh_color: {value: mesh_color},
			nbHex: {value: nb_hex},
			centerTexture : {value: centerTexture},
			positionTexture : {value: positionTexture},
			timer: {value: 0.0}
		}
	} );

	let mesh = new THREE.InstancedMesh(geometry, material, nb_hex);

	return mesh;
}

export const slide_anime = new Slide(
	function(DOM_hexmesh)
	{
		this.camera = new THREE.PerspectiveCamera(45, DOM_hexmesh.width / DOM_hexmesh.height, 0.1, 1000.0);
		this.camera.position.set(0, 0,26);
		
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

		this.vesselsVol = loadAnim();
		this.vesselsVol.layers.set(meshLayer);
		this.group.add(this.vesselsVol);

		this.vesselsSurf0 = Display.loadSurfaceView("off", Lung.lung0_off, {transparent: true, opacity: 0.1, color: new THREE.Color(0xFFFF00)});
		this.vesselsSurf0.layers.set(meshLayer);
		this.group.add(this.vesselsSurf0);

		this.vesselsSurf1 = Display.loadSurfaceView("off", Lung.lung1_off, {transparent: true, opacity: 0.1, color: new THREE.Color(0xFF0000)});
		this.vesselsSurf1.layers.set(meshLayer);
		this.group.add(this.vesselsSurf1);

		this.vesselsSurf2 = Display.loadSurfaceView("off", Lung.lung2_off, {transparent: true, opacity: 0.1, color: new THREE.Color(0x00FF00)});
		this.vesselsSurf2.layers.set(meshLayer);
		this.group.add(this.vesselsSurf2);

		this.vesselsSurf3 = Display.loadSurfaceView("off", Lung.lung3_off, {transparent: true, opacity: 0.1, color: new THREE.Color(0x0000FF)});
		this.vesselsSurf3.layers.set(meshLayer);
		this.group.add(this.vesselsSurf3);



		const axis = new THREE.Vector3(0, 1, 0);
		this.clock = new Clock(true);
		this.time = 0;
		
		this.toggleClipping = function(){
			this.vesselsVol.material.uniforms.clipping.value = 1 - this.vesselsVol.material.uniforms.clipping.value;
		};
		// this.toggleClipping();
		this.toggleVisible = function(){
			this.vesselsVol.visible = !this.vesselsVol.visible;
		};
		// this.toggleVisible();

		this.on = 1;
		this.pause = function(){
			this.on = 1 - this.on;
		};

		this.vesselsVol.position.set(0,11,0)
		this.vesselsVol.setRotationFromAxisAngle(new THREE.Vector3(1, 0, 0), -Math.PI/2)
		this.vesselsSurf0.position.set(0,11,0)
		this.vesselsSurf0.setRotationFromAxisAngle(new THREE.Vector3(1, 0, 0), -Math.PI/2)
		this.vesselsSurf1.position.set(0,11,0)
		this.vesselsSurf1.setRotationFromAxisAngle(new THREE.Vector3(1, 0, 0), -Math.PI/2)
		this.vesselsSurf2.position.set(0,11,0)
		this.vesselsSurf2.setRotationFromAxisAngle(new THREE.Vector3(1, 0, 0), -Math.PI/2)
		this.vesselsSurf3.position.set(0,11,0)
		this.vesselsSurf3.setRotationFromAxisAngle(new THREE.Vector3(1, 0, 0), -Math.PI/2)
		this.group.setRotationFromAxisAngle(axis, Math.PI);
		this.vesselsSurf0.material.side = THREE.BackSide;
		this.vesselsSurf1.material.side = THREE.BackSide;
		this.vesselsSurf2.material.side = THREE.BackSide;

		this.loop = function(){
			if(this.running){
				glRenderer.setSize(DOM_hexmesh.width, DOM_hexmesh.height);
				this.time += this.clock.getDelta() * this.on;
				this.vesselsVol.material.uniforms.timer.value = (1+Math.sin(this.time*0.6))/2;

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