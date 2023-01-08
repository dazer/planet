import * as THREE from './lib/threejs/three.module.js'
import { OrbitControls } from './lib/threejs/Orbitcontrols.js'
import Stats from './lib/threejs/stats.module.js'
import * as dat from './lib/threejs/dat.gui.module.js'

function getEle(sel) {
    if (!sel) return document.body
    if (typeof sel === 'string') return document.querySelector(sel)
    if (sel instanceof Event) return sel.target
    if (sel instanceof HTMLElement) return sel
    return null
}

const getExtension = fname => fname.slice(((fname.lastIndexOf('.') - 1) >>> 0) + 2)

function getEleDims(sel) {
    const ele = getEle(sel)
    const styles = getComputedStyle(ele)
    const wdt = Number.parseFloat(styles.width)
    const hgt = Number.parseFloat(styles.height)
    return {
        width: wdt,
        height: hgt,
        size: [wdt, hgt],
        aspect: wdt / hgt,
    }
}

export default class Graphics {
    #container

    scene
    camera
    renderer

    #controls
    #stats
    #gui

    #defOpts = {
        container: document.body,
        controls: true,
        stats: true,
        gui: true,
    }

    #textureLoader = new THREE.TextureLoader()

    static get ELE() {
        return Object.freeze({ AMBIENT_LIGHT: 0 })
    }
    static get MAP() {
        return Object.freeze({ DIFUSE: 'map', BUMP: 'bumpMap', ROUGHNESS: 'roughnessMap' })
    }

    constructor(opts = {}) {
        const kwargs = { ...this.#defOpts, ...opts }
        this.#container = getEle(kwargs.container)
        this.#init()

        if (kwargs.controls) this.#setupControls()
        if (kwargs.stats) this.#setupStats()
        if (kwargs.gui) this.#setupGui()
    }

    #init() {
        this.scene = new THREE.Scene()
        this.camera = new THREE.PerspectiveCamera(75, getEleDims(this.cotainer).aspect, 0.1, 1000)
        this.renderer = this.#buildRenderer()

        window.addEventListener('resize', e => {
            const containerDims = getEleDims(this.cotainer)
            this.camera.aspect = containerDims.aspect
            this.camera.updateProjectionMatrix()
            this.renderer.setSize(...containerDims.size)
        })
    }

    #buildRenderer() {
        const renderer = new THREE.WebGLRenderer({ antialias: true })
        renderer.setSize(...getEleDims(this.cotainer).size)
        renderer.setPixelRatio(window.devicePixelRatio)
        //renderer.autoClear = false
        //renderer.setClearColor(0x000000, 0.0)
        this.#container.appendChild(renderer.domElement)

        return renderer
    }

    render() {
        this.renderer.render(this.scene, this.camera)
        return this
    }

    onNewFrame() {
        this.#controls?.update()
        this.#stats?.update()
        this.render()
    }

    #setupControls() {
        return (this.#controls = new OrbitControls(this.camera, this.renderer.domElement))
    }

    #setupStats() {
        this.#stats = new Stats()
        this.#container.appendChild(this.#stats.dom)
        return this.#stats
    }

    #setupGui() {
        return (this.#gui = new dat.GUI({ autoPlace: true }))
    }

    get gui() {
        return this.#gui ?? this.#setupGui()
    }

    add(what, ...config) {
        let conf
        let ele
        switch (what) {
            case Graphics.ELE.AMBIENT_LIGHT:
                conf = config.length ? config : [0xffffff, 0.2]
                ele = new THREE.AmbientLight(...conf)
                this.scene.add(ele)
                break
            case Graphics.ELE.POINT_LIGHT:
                conf = config.length ? config : [0xffffff, 0.4]
                ele = new THREE.PointLight(...conf)
                this.scene.add(ele)
                break
        }
        return ele
    }

    addGuiFileUpload(name, fn) {
        if (!this.gui || !name || typeof fn !== 'function') return

        const fileInput = document.createElement('input')
        fileInput.setAttribute('type', 'file')
        fileInput.addEventListener('change', e => {
            if (!e.target.files.length) return
            guiInput.value = e.target.files[0].name
            fn(e.target.files)
        })

        const params = {}
        params[name] = ''
        const stringController = this.gui.add(params, name)

        const guiInput = stringController.domElement.querySelector('input')
        guiInput.setAttribute('readonly', true)
        guiInput.classList.add('file-upload')
        guiInput.addEventListener('click', e => fileInput.click())

        return {
            remove: () => {},
            clear: () => (guiInput.value = ''),
        }
    }

    updateTexture(file, mesh, map, onError) {
        onError = typeof onError === 'function' ? onError : () => console.log('error')
        if (!file) return onError()
        const allowedExtensions = ['jpg', 'png', 'gif']
        if (!allowedExtensions.includes(getExtension(file.name))) return onError()
        this.#textureLoader.loadAsync(URL.createObjectURL(file)).then(texture => (mesh.material[map] = texture))
    }
}
