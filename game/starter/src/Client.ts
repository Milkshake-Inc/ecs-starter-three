import { useQueries } from "@ecs/core/helpers";
import TickerEngine from "@ecs/core/TickerEngine";
import Space from "@ecs/plugins/space/Space";
import Transform from "@ecs/plugins/math/Transform";
import Vector3 from "@ecs/plugins/math/Vector";
import RenderSystem from "@ecs/plugins/render/3d/systems/RenderSystem";
import { InputSystem } from "@ecs/plugins/input/systems/InputSystem";
import FreeRoamCameraSystem from "@ecs/plugins/render/3d/systems/FreeRoamCameraSystem";
import { LoadGLTF, LoadTexture } from "@ecs/plugins/tools/ThreeHelper";
import { generateGradientSkybox } from "@ecs/plugins/render/3d/prefabs/GradientSkybox";
import {
    AmbientLight,
    Box3,
    BoxGeometry,
    CircleBufferGeometry,
    Color as ThreeColor,
    DirectionalLight,
    Fog,
    Mesh,
    MeshBasicMaterial,
    MeshPhongMaterial,
    PCFSoftShadowMap,
    PerspectiveCamera,
    Plane,
    PlaneGeometry,
    RepeatWrapping,
    Texture,
    TextureLoader,
} from "three";
import { GLTF } from "three/examples/jsm/loaders/GLTFLoader";
import { all, Entity, System } from "tick-knock";
import Color from "@ecs/plugins/math/Color";
import { Rotate } from "hammerjs";

export default class ExampleSpace extends Space {
    protected darkTexture: Texture;
    protected orangeTexture: Texture;

    protected async preload() {
        [this.darkTexture, this.orangeTexture] = await Promise.all([
            LoadTexture("texture.png"),
            LoadTexture("texture_orange.png"),
        ]);
    }

    createBox(position: Vector3, size = 0.05) {
        const entity = new Entity();
        entity.add(Transform, { position });
        entity.add(
            new Mesh(
                new BoxGeometry(size, size, size),
                new MeshPhongMaterial({
                    map: this.orangeTexture,
                    flatShading: true,
                    reflectivity: 0,
                    specular: 0,
                })
            ),
            {
                castShadow: true,
                receiveShadow: true,
            }
        );

        return entity;
    }

    setup() {
        const camera = new Entity();
        camera.add(Transform, { y: 2, z: 3.5, rx: -0.5 });
        camera.add(PerspectiveCamera);

        const ground = new Entity();
        ground.add(Transform, { rx: -Math.PI / 2 });

        if (this.darkTexture) {
            this.darkTexture.repeat.set(400, 400);
            this.darkTexture.wrapT = this.darkTexture.wrapS = RepeatWrapping;
        }

        ground.add(
            new Mesh(
                new PlaneGeometry(1000, 1000),
                new MeshPhongMaterial({ map: this.darkTexture, shininess: 0 })
            ),
            {
                castShadow: true,
                receiveShadow: true,
            }
        );

        const light = new Entity();
        light.add(new DirectionalLight(new ThreeColor(Color.White), 1), {
            castShadow: true,
        });
        light.get(DirectionalLight).shadow.mapSize.set(1024, 1024);
        light.get(DirectionalLight).shadow.radius = 80;
        light.add(new AmbientLight(new ThreeColor(Color.White), 0.4));
        light.add(Transform, { x: 10, y: 10, z: 5 });
        console.log("added camera");
        this.addEntities(camera, light, ground, light);

        this.addEntity(this.createBox(new Vector3(0, 0.5, 0), 1));
    }
}

export class Engine extends TickerEngine {
    constructor() {
        super();

        this.addSystem(
            new RenderSystem({
                color: 0x262626,
                configure: (renderer, scene) => {
                    // renderer.setPixelRatio(2);
                    renderer.shadowMap.type = PCFSoftShadowMap;
                    renderer.shadowMap.enabled = true;

                    scene.fog = new Fog(0x262626, 10, 200);
                },
            })
        );
        this.addSystem(new InputSystem());
        this.addSystem(new FreeRoamCameraSystem());

        new ExampleSpace(this, true);
    }
}

new Engine();
