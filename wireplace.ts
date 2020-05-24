import { WirePlaceScene } from 'wireplace-scene';
import type { Diff } from 'wireplace-scene';

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

function getRoom(roomId = 'default') {
  return rooms[roomId];
}

function join(userId: UserID): ActorID {
  const actorId = `a${globalId}`;
  globalId += 1;
  const { scene } = getRoom();
  scene.addActor(actorId);
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

function move(data: string) {
  console.log('move', data);
}

export { leave, move, join, sync, getUpdate };
