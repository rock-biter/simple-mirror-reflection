import './style.css'
import * as THREE from 'three'
// __controls_import__
// __gui_import__

import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls'
import { Pane } from 'tweakpane'

import fragmentShader from './shaders/water/fragment.glsl'
import vertexShader from './shaders/water/vertex.glsl'

/**
 * Debug
 */
// __gui__
const config = {
	// example: 5,
	pixelation: 1,
	reflectivity: 0.4,
	roughness: 0,
	roughnessScale: 20,
	frequency: 2,
	amplitude: 0.07,
}
const pane = new Pane()

// pane
// 	.addBinding(config, 'example', {
// 		min: 0,
// 		max: 10,
// 		step: 0.1,
// 	})
// 	.on('change', (ev) => console.log(ev.value))

pane
	.addBinding(config, 'reflectivity', {
		min: 0,
		max: 1,
		step: 0.01,
	})
	.on('change', (ev) => {
		waterMaterial.uniforms.uReflectivity.value = ev.value
	})

pane
	.addBinding(config, 'roughness', {
		min: 0,
		max: 0.1,
		step: 0.001,
	})
	.on('change', (ev) => {
		waterMaterial.uniforms.uRoughness.value = ev.value
	})

pane
	.addBinding(config, 'roughnessScale', {
		min: 1,
		max: 50,
		step: 0.5,
	})
	.on('change', (ev) => {
		waterMaterial.uniforms.uRoughnessScale.value = ev.value
	})

pane
	.addBinding(config, 'frequency', {
		min: 0.01,
		max: 5,
		step: 0.001,
	})
	.on('change', (ev) => {
		waterMaterial.uniforms.uFrequency.value = ev.value
	})

pane
	.addBinding(config, 'amplitude', {
		min: 0,
		max: 1,
		step: 0.01,
	})
	.on('change', (ev) => {
		waterMaterial.uniforms.uAmplitude.value = ev.value
	})

pane
	.addBinding(config, 'pixelation', {
		min: 1,
		max: 100,
		step: 1,
	})
	.on('change', (ev) => {
		waterMaterial.uniforms.uPixelation.value = ev.value

		reflectTarget.setSize(sizes.width / ev.value, sizes.height / ev.value)
	})

/**
 * Scene
 */
const scene = new THREE.Scene()
// scene.background = new THREE.Color(0xdedede)

// __box__
/**
 * BOX
 */
// const material = new THREE.MeshNormalMaterial()
const material = new THREE.MeshStandardMaterial({ color: 'tomato' })
const geometry = new THREE.TorusKnotGeometry(0.7, 0.3, 200, 100)
const mesh = new THREE.Mesh(geometry, material)
mesh.position.y += 1.5
scene.add(mesh)

// __floor__
/**
 * Plane
 */
const waterMaterial = new THREE.ShaderMaterial({
	fragmentShader,
	vertexShader,
	transparent: true,
	// wireframe: true,
	uniforms: {
		uReflectionMap: { value: new THREE.Uniform() },
		uTime: { value: 0 },
		uPixelation: { value: config.pixelation },
		uReflectivity: { value: config.reflectivity },
		uRoughness: { value: config.roughness },
		uRoughnessScale: { value: config.roughnessScale },
		uFrequency: { value: config.frequency },
		uAmplitude: { value: config.amplitude },
	},
})
const waterGeometry = new THREE.PlaneGeometry(15, 15, 200, 200)
waterGeometry.rotateX(-Math.PI * 0.5)
const water = new THREE.Mesh(waterGeometry, waterMaterial)
scene.add(water)

/**
 * render sizes
 */
const sizes = {
	width: window.innerWidth,
	height: window.innerHeight,
}

/**
 * Camera
 */
const fov = 60
const camera = new THREE.PerspectiveCamera(fov, sizes.width / sizes.height, 0.1)
camera.position.set(5, 1.5, 5)

// reflection
const reflectTarget = new THREE.WebGLRenderTarget(
	sizes.width / config.pixelation,
	sizes.height / config.pixelation,
	{
		format: THREE.RGBFormat,
		stencilBuffer: false,
		depthBuffer: true,
		minFilter: THREE.NearestFilter,
		magFilter: THREE.NearestFilter,
	}
)

waterMaterial.uniforms.uReflectionMap.value = reflectTarget.texture

const reflectionCamera = camera.clone()

/**
 * renderer
 */
const renderer = new THREE.WebGLRenderer({
	antialias: window.devicePixelRatio < 2,
})
document.body.appendChild(renderer.domElement)
handleResize()

/**
 * OrbitControls
 */
// __controls__
const controls = new OrbitControls(camera, renderer.domElement)
controls.target.set(0, 0.5, 0)
controls.enableDamping = true

/**
 * Lights
 */
const ambientLight = new THREE.AmbientLight(0xffffff, 1.5)
const directionalLight = new THREE.DirectionalLight(0xffffff, 4.5)
directionalLight.position.set(3, 10, 7)
scene.add(ambientLight, directionalLight)

// DEBUG
const planeGeometry = new THREE.PlaneGeometry(3, 3)
const planeMaterial = new THREE.MeshBasicMaterial({
	map: reflectTarget.texture,
})
const plane = new THREE.Mesh(planeGeometry, planeMaterial)
plane.position.set(4, 4, 0)
// scene.add(plane)

scene.background = new THREE.Color(0xbbccff)

/**
 * Three js Clock
 */
// __clock__
const clock = new THREE.Clock()
let time = 0

/**
 * frame loop
 */
function tic() {
	/**
	 * tempo trascorso dal frame precedente
	 */
	const dt = clock.getDelta()
	time += dt
	/**
	 * tempo totale trascorso dall'inizio
	 */
	// const time = clock.getElapsedTime()
	mesh.rotation.y += dt * 0.5
	mesh.rotation.x += dt * 0.5
	// mesh.position.y = 3.5 + Math.sin(time) * 1.5

	// __controls_update__
	controls.update()

	waterMaterial.uniforms.uTime.value = time

	// console.log('render')
	reflectionCamera.position.copy(camera.position)
	reflectionCamera.position.y *= -1
	const target = controls.target.clone()
	target.y *= -1
	reflectionCamera.lookAt(target)

	water.visible = false
	renderer.setRenderTarget(reflectTarget)
	renderer.clear()

	renderer.render(scene, reflectionCamera)

	renderer.setRenderTarget(null)
	water.visible = true

	renderer.render(scene, camera)

	requestAnimationFrame(tic)
}

requestAnimationFrame(tic)

window.addEventListener('resize', handleResize)

function handleResize() {
	sizes.width = window.innerWidth
	sizes.height = window.innerHeight

	camera.aspect = sizes.width / sizes.height
	reflectionCamera.aspect = sizes.width / sizes.height

	// camera.aspect = sizes.width / sizes.height;
	camera.updateProjectionMatrix()
	reflectionCamera.updateProjectionMatrix()

	renderer.setSize(sizes.width, sizes.height)
	reflectTarget.setSize(sizes.width, sizes.height)

	const pixelRatio = Math.min(window.devicePixelRatio, 2)
	renderer.setPixelRatio(pixelRatio)
}
