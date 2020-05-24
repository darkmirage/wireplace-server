import { WirePlaceScene, Actor } from 'wireplace-scene';
import { schemeSet2 } from 'd3-scale-chromatic';
import type { Update } from 'wireplace-scene';

let globalId = 0;

type UserID = string;
type ActorID = string;

type Room = {
  scene: WirePlaceScene;
};

const users: Record<UserID, ActorID> = {};

const rooms: Record<string, Room> = {
  default: {
    scene: new WirePlaceScene(),
  },
};

function getRandomPosition(): number {
  return Math.random() * 2.0 - 1.0;
}

function getRoom(roomId = 'default') {
  return rooms[roomId];
}

function join(userId: UserID): ActorID {
  const actorId = `a${globalId}`;
  const colorHex = schemeSet2[globalId % schemeSet2.length];
  const color = parseInt(colorHex.substr(1), 16);
  const position = { x: getRandomPosition(), y: 0, z: getRandomPosition() };
  globalId += 1;
  const { scene } = getRoom();
  scene.addActor(actorId);
  scene.updateActor(actorId, { color, position });
  users[userId] = actorId;
  return actorId;
}

function leave(userId: UserID): boolean {
  const actorId = users[userId];
  const { scene } = getRoom();
  return scene.removeActor(actorId);
}

function sync(userId: UserID): string {
  const { scene } = getRoom();
  const { data } = scene.retrieveSerializedDiff(true);
  return data;
}

function getUpdate(): string | null {
  const { scene } = getRoom();
  const { count, data } = scene.retrieveSerializedDiff(false);
  return count > 0 ? data : null;
}

function move(data: { id: ActorID; u: Update }) {
  const { scene } = getRoom();
  scene.updateActor(data.id, data.u);
}

export { leave, move, join, sync, getUpdate };
