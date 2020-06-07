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
    position: {
      x: 11.449999809265137,
      y: 1.2999999523162842,
      z: 8.649999618530273,
    },
    rotation: { x: 0, y: 1.5707963705062866, z: 0 },
    movable: true,
  },
  {
    assetId: 1002,
    position: { x: 4.300000190734863, y: 0, z: 3.9000000953674316 },
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
    position: { x: -1.4500000476837158, y: 0, z: -1.7000000476837158 },
    rotation: { x: 0, y: -0.39269909262657166, z: 0 },
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
    position: { x: -0.8999999761581421, y: 0, z: 1.2999999523162842 },
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
    position: { x: 5.699999809265137, y: 0, z: 4.599999904632568 },
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
    position: { x: -0.6499999761581421, y: 0.75, z: 3.6500000953674316 },
    rotation: { x: 0, y: 0.7853981852531433, z: 0 },
    movable: true,
  },
  {
    assetId: 1026,
    position: { x: -2.299999952316284, y: 0.75, z: 4.099999904632568 },
    rotation: { x: 0, y: -0.39269909262657166, z: 0 },
    movable: true,
  },
  {
    assetId: 1015,
    position: { x: 9.649999618530273, y: 0, z: 2.5 },
    rotation: { x: 0, y: 0, z: 0 },
    movable: true,
  },
  {
    assetId: 1023,
    position: { x: -3.9000000953674316, y: 0.75, z: 3.8499999046325684 },
    rotation: { x: 0, y: 0.39269909262657166, z: 0 },
    movable: true,
  },
  {
    assetId: 1023,
    position: {
      x: 3.450000047683716,
      y: 0.800000011920929,
      z: 7.900000095367432,
    },
    rotation: { x: 0, y: -1.5707963705062866, z: 0 },
    movable: true,
  },
  {
    assetId: 1024,
    position: { x: -2.6500000953674316, y: 0.75, z: 2.4000000953674316 },
    rotation: {
      x: -3.1415927410125732,
      y: 0.39269909262657166,
      z: -3.1415927410125732,
    },
    movable: true,
  },
  {
    assetId: 1025,
    position: { x: 9.25, y: 0.75, z: 2.200000047683716 },
    rotation: { x: 0, y: 0.7853981852531433, z: 0 },
    movable: true,
  },
  {
    assetId: 1027,
    position: { x: 0.4000000059604645, y: 0, z: -2.6500000953674316 },
    rotation: {
      x: 1.5099580252808664e-7,
      y: 2.1855695919725804e-8,
      z: 8.742277657347586e-8,
    },
    movable: true,
  },
  {
    assetId: 1028,
    position: { x: 2.75, y: 0, z: 8.149999618530273 },
    rotation: { x: 0, y: 1.5707963705062866, z: 0 },
    movable: true,
  },
  {
    assetId: 1030,
    position: { x: 3.299999952316284, y: 0.75, z: 8.699999809265137 },
    rotation: { x: 0, y: 0, z: 0 },
    movable: true,
  },
  {
    assetId: 1031,
    position: { x: 9.149999618530273, y: 0.75, z: 3 },
    rotation: {
      x: -3.1415927410125732,
      y: 1.1780972480773926,
      z: -3.1415927410125732,
    },
    movable: true,
  },
  {
    assetId: 1032,
    position: { x: 2.049999952316284, y: 0, z: -2.9000000953674316 },
    rotation: { x: 0, y: 0, z: 0 },
    movable: true,
  },
  {
    assetId: 1032,
    position: { x: -4.949999809265137, y: 0, z: 2.1500000953674316 },
    rotation: { x: 0, y: 0, z: 0 },
    movable: true,
  },
  {
    assetId: 1032,
    position: { x: 9.050000190734863, y: 0, z: 4.099999904632568 },
    rotation: { x: 0, y: 0, z: 0 },
    movable: true,
  },
  {
    assetId: 1033,
    position: { x: 5.099999904632568, y: 0, z: 1.9500000476837158 },
    rotation: { x: 0, y: -0.39269909262657166, z: 0 },
    movable: true,
  },
  {
    assetId: 1034,
    position: { x: 7.449999809265137, y: 1, z: 9.75 },
    rotation: { x: 0, y: 0, z: 0 },
    movable: true,
  },
  {
    assetId: 1023,
    position: { x: 3.5999999046325684, y: 0.75, z: 9.649999618530273 },
    rotation: { x: 0, y: 0, z: 0 },
    movable: true,
  },
  {
    assetId: 1021,
    position: { x: -3.450000047683716, y: 0, z: -2.9000000953674316 },
    rotation: { x: 0, y: 0, z: 0 },
    movable: true,
  },
  {
    assetId: 1028,
    position: { x: 10.75, y: 0, z: 3.4000000953674316 },
    rotation: {
      x: 3.1415927410125732,
      y: -1.1780972480773926,
      z: 3.1415927410125732,
    },
    movable: true,
  },
  {
    assetId: 1036,
    position: { x: 4.449999809265137, y: 0, z: 3.950000047683716 },
    rotation: { x: 0, y: -0.39269909262657166, z: 0 },
    movable: true,
  },
  {
    assetId: 1037,
    position: { x: -4.800000190734863, y: 0, z: -2.950000047683716 },
    rotation: { x: 0, y: 0, z: 0 },
    movable: true,
  },
  {
    assetId: 1038,
    position: { x: -2, y: 0, z: -0.949999988079071 },
    rotation: { x: 0, y: -0.7853981852531433, z: 0 },
    movable: true,
  },
  {
    assetId: 1037,
    position: { x: -6.050000190734863, y: 0, z: -2.950000047683716 },
    rotation: { x: 0, y: 0, z: 0 },
    movable: true,
  },
  {
    assetId: 1039,
    position: { x: -5.599999904632568, y: 0, z: 4.949999809265137 },
    rotation: {
      x: -3.1415927410125732,
      y: 1.1780972480773926,
      z: -3.1415927410125732,
    },
    movable: true,
  },
  {
    assetId: 1004,
    position: { x: -2.450000047683716, y: 0, z: -3.4000000953674316 },
    rotation: { x: 0, y: 0, z: 0 },
    movable: true,
  },
  {
    assetId: 1004,
    position: { x: -4.900000095367432, y: 0, z: -3.4000000953674316 },
    rotation: { x: 0, y: 0, z: 0 },
    movable: true,
  },
  {
    assetId: 1004,
    position: { x: -7.400000095367432, y: 0, z: -3.4000000953674316 },
    rotation: { x: 0, y: 0, z: 0 },
    movable: true,
  },
  {
    assetId: 1004,
    position: { x: 4.900000095367432, y: 0, z: -1.100000023841858 },
    rotation: { x: 0, y: 0, z: 0 },
    movable: true,
  },
  {
    assetId: 1004,
    position: { x: 7.349999904632568, y: 0, z: -1.100000023841858 },
    rotation: { x: 0, y: 0, z: 0 },
    movable: true,
  },
  {
    assetId: 1004,
    position: { x: 9.850000381469727, y: 0, z: -1.100000023841858 },
    rotation: { x: 0, y: 0, z: 0 },
    movable: true,
  },
  {
    assetId: 1004,
    position: { x: -9.850000381469727, y: 0, z: -3.450000047683716 },
    rotation: { x: 0, y: 0, z: 0 },
    movable: true,
  },
  {
    assetId: 1004,
    position: { x: -12.350000381469727, y: 0, z: -3.4000000953674316 },
    rotation: { x: 0, y: 4.371139183945161e-8, z: 0 },
    movable: true,
  },
  {
    assetId: 1008,
    position: { x: -3.0999999046325684, y: 0, z: -1.2999999523162842 },
    rotation: { x: 0, y: 1.1780972480773926, z: 0 },
    movable: true,
  },
  {
    assetId: 1004,
    position: { x: 12.5, y: 0, z: -1.100000023841858 },
    rotation: { x: 0, y: -1.570796251296997, z: 0 },
    movable: true,
  },
  {
    assetId: 1040,
    position: { x: -12.350000381469727, y: 0, z: -0.75 },
    rotation: { x: 0, y: 1.5707963705062866, z: 0 },
    movable: true,
  },
  {
    assetId: 1041,
    position: { x: 2.3499999046325684, y: 0, z: 9.800000190734863 },
    rotation: { x: 0, y: 1.5707963705062866, z: 0 },
    movable: true,
  },
  {
    assetId: 1041,
    position: { x: 9.100000381469727, y: 0, z: 5.150000095367432 },
    rotation: { x: 0, y: 0, z: 0 },
    movable: true,
  },
  {
    assetId: 1042,
    position: { x: -1.5, y: 2.0999999046325684, z: -3.25 },
    rotation: { x: 0, y: 0, z: 0 },
    movable: true,
  },
  {
    assetId: 1043,
    position: { x: 6.949999809265137, y: 1.75, z: -0.949999988079071 },
    rotation: { x: 0, y: 0, z: 0 },
    movable: true,
  },
  {
    assetId: 1040,
    position: { x: -6.349999904632568, y: 0, z: 11.649999618530273 },
    rotation: { x: 0, y: 1.5707963705062866, z: 0 },
    movable: true,
  },
  {
    assetId: 1040,
    position: { x: -12.149999618530273, y: 0, z: 3.5 },
    rotation: { x: 0, y: -1.5707963705062866, z: 0 },
    movable: true,
  },
  {
    assetId: 1040,
    position: { x: -6.300000190734863, y: 0, z: 9.25 },
    rotation: {
      x: -3.1415927410125732,
      y: 0.7853981852531433,
      z: -3.1415927410125732,
    },
    movable: true,
  },
];

export default createDefaultScene;
