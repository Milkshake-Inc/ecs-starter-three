import { useQueries } from '@ecs/core/helpers';
import TickerEngine from '@ecs/core/TickerEngine';
import Transform from '@ecs/plugins/math/Transform';
import Vector3 from '@ecs/plugins/math/Vector';
import { LoadPixiAssets } from '@ecs/plugins/render/2d/helpers/PixiHelper';
import PixiRenderSystem from '@ecs/plugins/render/2d/systems/PixiRenderSystem';
import { Container, Point, Sprite, TilingSprite } from 'pixi.js';
import { all, Entity, System } from 'tick-knock';

const ScreenSize = new Vector3(1280, 720);
const ScreenCenter = ScreenSize.multi(0.5);

const Assets = {
    BACKGROUND_PATTERN: "pattern.png",
    BOX: "box.png",
    LOGO: "logo.png",
}

export class Engine extends TickerEngine {
    constructor() {
        super();

        this.addSystem(new PixiRenderSystem());
        this.addSystem(new RotationMovementSystem());

        const container = new Container();
        container.addChild(TilingSprite.from(Assets.BACKGROUND_PATTERN, {
            width: ScreenSize.x,
            height: ScreenSize.y,
        }));

        const background = new Entity();
        background.add(Transform);
        background.add(container);
        this.addEntities(background);

        const box = new Entity();
        box.add(Transform, {
            scale: Vector3.Equal(0.5),
            position: ScreenCenter.clone()
        });
        box.add(Sprite.from(Assets.BOX), {
            anchor: new Point(0.5, 0.5)
        });
        box.add(RotationMovement);
        this.addEntities(box);

        const logo = new Entity();
        logo.add(Transform, {
            scale: Vector3.Equal(0.6),
            position: ScreenSize.sub(new Vector3(20, 20))
        });
        logo.add(Sprite.from(Assets.LOGO), {
            anchor: new Point(1, 1)
        });
        this.addEntities(logo);
    }
}

class RotationMovement {
    speed = 0.002
}

class RotationMovementSystem extends System {
    queries = useQueries(this, {
        sinMovement: all(RotationMovement, Transform)
    });

    update(deltaTime: number) {
        this.queries.sinMovement.forEach((entity) => {

            const { speed } = entity.get(RotationMovement);
            entity.get(Transform).rx += speed * deltaTime;
        })
    }
}

// Preload assets before starting
LoadPixiAssets(Assets).then(() => {
    new Engine();
})
