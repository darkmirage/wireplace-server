import {
  ActorID,
  IMasterScene,
  Update,
  WirePlaceScene,
  WirePlaceSceneSerialized,
} from 'wireplace-scene';

function createDefaultScene(): IMasterScene<WirePlaceSceneSerialized> {
  const scene = new WirePlaceScene();

  DefaultScene.forEach((u) => {
    const actorId = scene.nextActorID();
    scene.addActor(actorId);
    scene.updateActor(actorId, u);
  });

  return scene;
}

const DefaultScene: Update[] = [
  {
    assetId: 1001,
    position: { x: -2.4000000953674316, y: 0, z: -1.2999999523162842 },
    rotation: { x: 0, y: 0, z: 0 },
    movable: true,
  },
  {
    assetId: 1002,
    position: { x: 4.400000095367432, y: 0, z: 3.200000047683716 },
    rotation: {
      x: 3.1415927410125732,
      y: -1.1780972480773926,
      z: 3.1415927410125732,
    },
    movable: true,
  },
  {
    assetId: 1004,
    position: { x: 0, y: 0, z: -3.4000000953674316 },
    rotation: { x: 0, y: 0, z: 0 },
    movable: true,
  },
  {
    assetId: 1005,
    position: { x: 2.5, y: 0, z: -1.100000023841858 },
    rotation: { x: 0, y: 0, z: 0 },
    movable: true,
  },
  {
    assetId: 1006,
    position: { x: 2.5999999046325684, y: 0, z: -3.4000000953674316 },
    rotation: { x: 0, y: -1.5707963705062866, z: 0 },
    movable: true,
  },
  {
    assetId: 1007,
    position: { x: 3.049999952316284, y: 0, z: 6.699999809265137 },
    rotation: { x: 0, y: 0, z: 0 },
    movable: true,
  },
  {
    assetId: 1008,
    position: { x: 6, y: 0, z: 0.20000000298023224 },
    rotation: { x: 0, y: 0, z: 0 },
    movable: true,
  },
  {
    assetId: 1009,
    position: { x: 0.30000001192092896, y: 0, z: 3.9000000953674316 },
    rotation: {
      x: 3.1415927410125732,
      y: -1.1780972480773926,
      z: 3.1415927410125732,
    },
    movable: true,
  },
  {
    assetId: 1009,
    position: { x: -3.5, y: 0, z: 1.7000000476837158 },
    rotation: { x: 0, y: 0, z: 0 },
    movable: true,
  },
  {
    assetId: 1009,
    position: { x: -0.8999999761581421, y: 0, z: 1.399999976158142 },
    rotation: { x: 0, y: -0.39269909262657166, z: 0 },
    movable: true,
  },
  {
    assetId: 1009,
    position: { x: -2.5, y: 0, z: 4.900000095367432 },
    rotation: {
      x: -3.141592502593994,
      y: -1.8874469986940312e-8,
      z: -3.141592502593994,
    },
    movable: true,
  },
  {
    assetId: 1000,
    position: { x: -2.4000000953674316, y: 0, z: 3.299999952316284 },
    rotation: { x: 0, y: 0, z: 0 },
    movable: true,
  },
  {
    assetId: 1009,
    position: { x: -3.799999952316284, y: 0, z: 4.699999809265137 },
    rotation: {
      x: -3.1415927410125732,
      y: 0.39269909262657166,
      z: -3.1415927410125732,
    },
    movable: true,
  },
  {
    assetId: 1009,
    position: { x: -1.100000023841858, y: 0, z: 4.800000190734863 },
    rotation: {
      x: 3.1415927410125732,
      y: -1.2246468525851679e-16,
      z: 3.1415927410125732,
    },
    movable: true,
  },
  {
    assetId: 1009,
    position: { x: -2.200000047683716, y: 0, z: 1.399999976158142 },
    rotation: { x: 0, y: 0, z: 0 },
    movable: true,
  },
  {
    assetId: 1010,
    position: { x: 6, y: 1.0499999523162842, z: 9.800000190734863 },
    rotation: { x: 0, y: -4.371139183945161e-8, z: 0 },
    movable: true,
  },
  {
    assetId: 1011,
    position: {
      x: 5.900000095367432,
      y: 1.0499999523162842,
      z: 9.399999618530273,
    },
    rotation: { x: 0, y: -4.371139183945161e-8, z: 0 },
    movable: true,
  },
  {
    assetId: 1012,
    position: { x: 5.900000095367432, y: 0, z: 3.9000000953674316 },
    rotation: {
      x: 3.1415927410125732,
      y: -1.1780972480773926,
      z: 3.1415927410125732,
    },
    movable: true,
  },
  {
    assetId: 1013,
    position: { x: -1.5, y: 0.75, z: 2.6500000953674316 },
    rotation: { x: 0, y: 0, z: 0 },
    movable: true,
  },
  {
    assetId: 1016,
    position: { x: 3.4000000953674316, y: 0, z: 8.050000190734863 },
    rotation: { x: 0, y: -1.5707963705062866, z: 0 },
    movable: true,
  },
  {
    assetId: 1017,
    position: { x: 5.900000095367432, y: 0, z: 9.550000190734863 },
    rotation: { x: 0, y: 0, z: 0 },
    movable: true,
  },
  {
    assetId: 1018,
    position: {
      x: 4.400000095367432,
      y: 0.800000011920929,
      z: 9.600000381469727,
    },
    rotation: { x: 0, y: -0.39269909262657166, z: 0 },
    movable: true,
  },
  {
    assetId: 1017,
    position: { x: 7.550000190734863, y: 0, z: 9.600000381469727 },
    rotation: { x: 0, y: 0, z: 0 },
    movable: true,
  },
  {
    assetId: 1016,
    position: { x: 4, y: 0, z: 9.550000190734863 },
    rotation: { x: 0, y: 0, z: 0 },
    movable: true,
  },
  {
    assetId: 1020,
    position: { x: -0.6499999761581421, y: 0.75, z: 3.4000000953674316 },
    rotation: { x: 0, y: 0, z: 0 },
    movable: true,
  },
  {
    assetId: 1026,
    position: { x: -2.299999952316284, y: 0.75, z: 4.099999904632568 },
    rotation: { x: 0, y: -0.39269909262657166, z: 0 },
    movable: true,
  },
];

export default createDefaultScene;
