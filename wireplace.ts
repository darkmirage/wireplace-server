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

interface UserPublic {
  actorId: ActorID;
  color: number;
  username: string;
}

interface UserPrivate {
  assetId: number;
  token: string;
}

type User = UserPublic & UserPrivate;

interface ChatLine {
  color: number;
  lineId: number;
  message: string;
  time: number;
  username: string;
}

const NUMBER_ASSETS = 2;

const lines: Array<ChatLine> = [];

const users: Record<UserID, User> = {};
const actorsToUsers: Record<ActorID, User> = {};

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
  const userRecord = { actorId, color, username, token, assetId };
  users[userId] = userRecord;
  actorsToUsers[actorId] = userRecord;
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

function getUser(actorId: string): UserPublic | undefined {
  const user = actorsToUsers[actorId];
  if (!user) {
    return undefined;
  }
  const { username, color } = user;
  return { username, color, actorId };
}

function getUsers(actorIds: Array<ActorID>): Record<ActorID, UserPublic> {
  const results: Record<ActorID, UserPublic> = {};
  for (const actorId of actorIds) {
    const user = getUser(actorId);
    if (user) {
      results[actorId] = user;
    }
  }
  return results;
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
    const { username, color } = user;
    const lineId = nextLineId;
    const line: ChatLine = { lineId, time, username, message, color };
    lines.push(line);
    nextLineId += 1;
    return line;
  } else {
    return null;
  }
}

export { leave, move, join, sync, getUpdate, getUsers, say };
