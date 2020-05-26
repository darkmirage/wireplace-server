import { WirePlaceScene } from 'wireplace-scene';
import { schemeSet1 } from 'd3-scale-chromatic';
import type { Update, WirePlaceSceneSerialized } from 'wireplace-scene';

let nextActorId = 0;
let nextLineId = 0;

type UserID = string;
type ActorID = string;

type Room = {
  scene: WirePlaceScene;
};

interface User {
  actorId: ActorID;
  color: number;
  assetId: number;
  username: string;
  token: string;
}

interface ChatLine {
  lineId: number;
  time: number;
  username: string;
  message: string;
}

const NUMBER_ASSETS = 2;

const lines: Array<ChatLine> = [];

const users: Record<UserID, User> = {};

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

function join(userId: UserID, username: string, token: string): ActorID {
  const actorId = `a${nextActorId}`;
  const colorHex = schemeSet1[nextActorId % schemeSet1.length];
  const color = parseInt(colorHex.substr(1), 16);
  const assetId = Math.floor(Math.random() * Math.floor(NUMBER_ASSETS));
  const position = { x: getRandomPosition(), y: 0, z: getRandomPosition() };
  nextActorId += 1;
  const { scene } = getRoom();
  scene.addActor(actorId);
  scene.updateActor(actorId, { color, position, assetId });
  users[userId] = { actorId, color, username, token, assetId };
  return actorId;
}

function leave(userId: UserID): boolean {
  const { actorId } = users[userId];
  const { scene } = getRoom();
  delete users[userId];
  return scene.removeActor(actorId);
}

function sync(userId: UserID): WirePlaceSceneSerialized {
  const { scene } = getRoom();
  const { data } = scene.retrieveSerializedDiff(true);
  return data;
}

function getUpdate(): WirePlaceSceneSerialized | null {
  const { scene } = getRoom();
  const { count, data } = scene.retrieveSerializedDiff(false);
  return count > 0 ? data : null;
}

function move(userId: UserID, u: Update) {
  const { scene } = getRoom();
  const user = users[userId];
  if (user) {
    const { actorId } = user;
    scene.updateActor(actorId, u);
  }
}

function say(userId: UserID, message: string): ChatLine | null {
  const time = Date.now();
  const user = users[userId];
  if (user) {
    const { username } = user;
    const lineId = nextLineId;
    const line = { lineId, time, username, message };
    lines.push(line);
    nextLineId += 1;
    return line;
  } else {
    return null;
  }
}

export { leave, move, join, sync, getUpdate, say };
