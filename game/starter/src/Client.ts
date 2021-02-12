import { useQueries } from '@ecs/core/helpers';
import TickerEngine from '@ecs/core/TickerEngine';
import Transform from '@ecs/plugins/math/Transform';
import Vector3 from '@ecs/plugins/math/Vector';
import RenderSystem from '@ecs/plugins/render/3d/systems/RenderSystem';
import { InputSystem } from '@ecs/plugins/input/systems/InputSystem';
import FreeRoamCameraSystem from '@ecs/plugins/render/3d/systems/FreeRoamCameraSystem';
import { LoadGLTF } from '@ecs/plugins/tools/ThreeHelper';
import { generateGradientSkybox } from '@ecs/plugins/render/3d/prefabs/GradientSkybox';
import { AmbientLight, Box3, BoxGeometry, CircleBufferGeometry, Color as ThreeColor, DirectionalLight, Mesh, MeshBasicMaterial, MeshPhongMaterial, PerspectiveCamera, Plane, TextureLoader } from 'three';
import { GLTF } from 'three/examples/jsm/loaders/GLTFLoader';
import { all, Entity, System } from 'tick-knock';
import Color from '@ecs/plugins/math/Color';
import { Rotate } from 'hammerjs';

export class Engine extends TickerEngine {
    constructor(model:GLTF) {
        super();

        this.addSystem(new RenderSystem());
        this.addSystem(new BoyantMovementSystem());
        this.addSystem(new RotateMovementSystem())
        this.addSystem(new InputSystem());
        this.addSystem(new FreeRoamCameraSystem());

        const boat = new Entity();
        boat.add(Transform, {x: 0.4, y: -0.1, z: 7});
        boat.add(model.scene);
        boat.add(BoyantMovement);

        const logoTexture = new TextureLoader().load('logo.png');

        const logo = new Entity();
        logo.add(Transform, {y: 1, z: -5});
        logo.add(new Mesh(new BoxGeometry(1, 1, 1), new MeshPhongMaterial({map: logoTexture, transparent: true})));
        logo.add(RotateMovement);
        logo.add(BoyantMovement, {distance: 0.003});

        const water = new Entity();
        water.add(Transform, {rx: -Math.PI/2});
        water.add(new Mesh(new CircleBufferGeometry(3000, 30), new MeshPhongMaterial({
            color: Color.Aqua
        })));

        const sky = generateGradientSkybox()

        const light = new Entity();
		light.add(Transform, {x: 3});
		light.add(new DirectionalLight(new ThreeColor(Color.White), 1));
		light.add(new AmbientLight(new ThreeColor(Color.White), 0.4));

        const camera = new Entity();
		camera.add(Transform, {y: 2, rx: -Math.PI/9});
		camera.add(PerspectiveCamera);

        this.addEntities(boat, water, sky, light, camera, logo);
    }
}

class BoyantMovement {
    elapsed = 0
    speed = 0.001
    distance = 0.0003
}

class BoyantMovementSystem extends System {

    queries = useQueries(this, {
        movement: all(BoyantMovement, Transform)
    });

    update(deltaTime: number) {
        this.queries.movement.forEach((entity) => {
            const movement = entity.get(BoyantMovement);

            movement.elapsed += deltaTime * movement.speed;

            entity.get(Transform).y += Math.sin(movement.elapsed) * movement.distance;
        })
    }
}

class RotateMovement {
    speed = 0.002
}

class RotateMovementSystem extends System {
    queries = useQueries(this, {
        movement: all(RotateMovement, Transform)
    });

    update(deltaTime: number) {
        this.queries.movement.forEach((entity) => {
            const {speed} = entity.get(RotateMovement);

            entity.get(Transform).ry += speed * deltaTime;
        })
    }
}

// Preload assets before starting
LoadGLTF("boat_small.gltf").then((gltf) => {
    new Engine(gltf);
})
