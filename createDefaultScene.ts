import {
  ActorID,
  IMasterScene,
  Update,
  WirePlaceScene,
  WirePlaceSceneSerialized,
} from 'wireplace-scene';

const DefaultScene: Update[] = [
  {
    assetId: 1001,
    movable: true,
    position: {
      x: 0,
      y: 0,
      z: 0,
    },
    rotation: {
      x: 0,
      y: 0,
      z: 0,
    },
    action: {
      type: 0,
      state: -2,
    },
    speed: 10,
  },
];

function createDefaultScene(): IMasterScene<WirePlaceSceneSerialized> {
  const scene = new WirePlaceScene();

  DefaultScene.forEach((u) => {
    const actorId = scene.nextActorID();
    scene.addActor(actorId);
    scene.updateActor(actorId, u);
  });

  return scene;
}

export default createDefaultScene;
