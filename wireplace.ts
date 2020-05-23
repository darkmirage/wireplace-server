import { WirePlaceScene } from 'wireplace-scene';

let globalId = 0;

type Room = {
  scene: WirePlaceScene;
}

const rooms: Record<string, Room> = {
  'default': {
    scene: new WirePlaceScene(),
  },
};

function getRoom(roomId = 'default') {
  return rooms[roomId];
}

function join() {
  const actorId = globalId.toString();
  globalId += 1;
  const { scene } = getRoom();
  scene.addActor(actorId);
  return actorId;
}

function move(data: string) {
  console.log('move', data);
}

export {
  move,
  join,
};
