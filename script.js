import * as THREE from './lib/threejs/three.module.js'
import Graphics from './Graphics.js'
import MAPS from './maps.js'

const getExtension = fname => fname.slice(((fname.lastIndexOf('.') - 1) >>> 0) + 2)

const graphics = new Graphics({
    container: '#container',
})

let planet, clouds

function init() {
    const planetGeo = new THREE.SphereGeometry(2, 64, 64)
    const planetMesh = new THREE.MeshStandardMaterial({ bumpScale: 0.3 })
    planet = new THREE.Mesh(planetGeo, planetMesh)

    const textureLoader = new THREE.TextureLoader()
    const diffuseMap = textureLoader.loadAsync(MAPS.diffuse)
    const roughnessMap = textureLoader.loadAsync(MAPS.bump)
    const bumpMap = textureLoader.loadAsync(MAPS.roughness)

    Promise.all([diffuseMap, roughnessMap, bumpMap]).then(values => {
        const [diffuse, roughness, bump] = values
        planet.material.map = diffuse
        planet.material.roughnessMap = roughness
        planet.material.bumpMap = bump
        graphics.scene.add(planet)
    })

    const cloudGeo = new THREE.SphereGeometry(2.05, 64, 64)
    const cloudMesh = new THREE.MeshStandardMaterial()
    clouds = new THREE.Mesh(cloudGeo, cloudMesh)
    textureLoader.loadAsync('textures/earthCloud.png').then(texture => {
        clouds.material.map = texture
        clouds.material.transparent = true
        graphics.scene.add(clouds)
    })

    graphics.camera.position.z = 5

    graphics.add(Graphics.ELE.AMBIENT_LIGHT)

    const pointLight = graphics.add(Graphics.ELE.POINT_LIGHT)
    pointLight.position.set(5, 3, 5)

    graphics.gui
        .add({ x: 0.05 }, 'x', 0, 1)
        .name('altura nubes')
        .onChange(v => {
            const radioPlanet = 2
            const baseAlturaNubes = 0.05
            const baseRadioNubes = radioPlanet + baseAlturaNubes

            const newRad = radioPlanet + v + 0.003
            const scale = newRad / baseRadioNubes

            clouds.scale.x = scale
            clouds.scale.y = scale
            clouds.scale.z = scale
        })

    const diffuseMapController = graphics.addGuiFileUpload('Diffuse map', files => {
        graphics.updateTexture(files[0], planet, Graphics.MAP.DIFUSE, () => diffuseMapController.clear())
    })
    const bumpMapController = graphics.addGuiFileUpload('Bump map', files => {
        graphics.updateTexture(files[0], planet, Graphics.MAP.BUMP, () => bumpMapController.clear())
    })
    const roughnessMapController = graphics.addGuiFileUpload('Roughness map', files => {
        graphics.updateTexture(files[0], planet, Graphics.MAP.ROUGHNESS, () => roughnessMapController.clear())
    })
}

function animate() {
    requestAnimationFrame(animate)

    planet.rotation.y += 0.005
    clouds.rotation.y -= 0.001
    //planet.rotation.x += 0.01
    graphics.onNewFrame()
}

init()
animate()
