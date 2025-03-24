import './style.css'
import * as THREE from 'three'
// __controls_import__
// __gui_import__

import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls'
import { Pane } from 'tweakpane'

import fragmentShader from './shaders/mirror/fragment.glsl'
import vertexShader from './shaders/mirror/vertex.glsl'

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
		mirrorMaterial.uniforms.uReflectivity.value = ev.value
	})

pane
	.addBinding(config, 'roughness', {
		min: 0,
		max: 0.1,
		step: 0.001,
	})
	.on('change', (ev) => {
		mirrorMaterial.uniforms.uRoughness.value = ev.value
	})

pane
	.addBinding(config, 'roughnessScale', {
		min: 1,
		max: 50,
		step: 0.5,
	})
	.on('change', (ev) => {
		mirrorMaterial.uniforms.uRoughnessScale.value = ev.value
	})

pane
	.addBinding(config, 'pixelation', {
		min: 1,
		max: 100,
		step: 1,
	})
	.on('change', (ev) => {
		mirrorMaterial.uniforms.uPixelation.value = ev.value

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
const material = new THREE.MeshStandardMaterial({ color: 'yellow' })
const geometry = new THREE.IcosahedronGeometry(1)
const mesh = new THREE.Mesh(geometry, material)
mesh.position.y += 2
scene.add(mesh)

const cone = new THREE.Mesh(
	new THREE.ConeGeometry(1, 2, 40),
	new THREE.MeshLambertMaterial({ color: 'coral' })
)

cone.position.set(-3.7, 1, -5.5)
scene.add(cone)

const cube = new THREE.Mesh(
	new THREE.BoxGeometry(2, 2, 2),
	new THREE.MeshLambertMaterial({ color: 'azure' })
)

cube.position.set(5.2, 1, -3.2)
scene.add(cube)

// __floor__
/**
 * Plane
 */
const mirrorMaterial = new THREE.ShaderMaterial({
	fragmentShader,
	vertexShader,
	uniforms: {
		uReflectionMap: { value: new THREE.Uniform() },
		uTime: { value: 0 },
		uPixelation: { value: config.pixelation },
		uReflectivity: { value: config.reflectivity },
		uRoughness: { value: config.roughness },
		uRoughnessScale: { value: config.roughnessScale },
	},
})
const mirrorGeometry = new THREE.PlaneGeometry(100, 100)
mirrorGeometry.rotateX(-Math.PI * 0.5)
const mirror = new THREE.Mesh(mirrorGeometry, mirrorMaterial)
scene.add(mirror)

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
camera.position.set(8, 8, 8)
camera.lookAt(new THREE.Vector3(0, 2.5, 0))

/**
 * Show the axes of coordinates system
 */
// __helper_axes__
const axesHelper = new THREE.AxesHelper(3)
// scene.add(axesHelper)

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

mirrorMaterial.uniforms.uReflectionMap.value = reflectTarget.texture
// mirrorMaterial.map = reflectTarget.texture

// mirror.onBeforeRender = () => {
// 	// console.log('render')
// 	reflectionCamera.position.copy(camera.position)
// 	reflectionCamera.position.y *= -1
// 	const target = controls.target.clone()
// 	target.y *= -1
// 	reflectionCamera.lookAt(target)

// 	mirror.visible = false
// 	renderer.setRenderTarget(reflectTarget)
// 	// renderer.clear()

// 	// plane.visible = false
// 	renderer.render(scene, reflectionCamera)
// 	renderer.setRenderTarget(null)
// 	mirror.visible = true
// 	// plane.visible = true
// }

// reflectTarget.texture.generateMipmaps = false

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

scene.background = new THREE.Color(0x020202)

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
	mesh.rotation.y += dt
	mesh.position.y = 3.5 + Math.sin(time) * 1.5

	// __controls_update__
	controls.update()

	mirrorMaterial.uniforms.uTime.value = time

	// console.log('render')
	reflectionCamera.position.copy(camera.position)
	reflectionCamera.position.y *= -1
	const target = controls.target.clone()
	target.y *= -1
	reflectionCamera.lookAt(target)

	mirror.visible = false
	renderer.setRenderTarget(reflectTarget)
	renderer.clear()

	// plane.visible = false
	renderer.render(scene, reflectionCamera)

	renderer.setRenderTarget(null)
	mirror.visible = true
	// plane.visible = true

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
