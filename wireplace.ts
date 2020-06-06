import {
  ActorID,
  IMasterScene,
  Update,
  WirePlaceSceneSerialized,
} from 'wireplace-scene';
import { schemeCategory10 } from 'd3-scale-chromatic';
import { RtcTokenBuilder, RtcRole } from 'agora-access-token';

import logger from './logger';
import createDefaultScene from './createDefaultScene';

const AGORA_APP_ID = '2fe980bdfc9f40f9bde6d0348f8f2f9d';
const AGORO_CERTIFICATE = 'b21e0b9643254bf7a649c0319c10a3a5';

let nextLineId = 0;

type UserID = string;
type RoomID = string;

type Room = {
  scene: IMasterScene<WirePlaceSceneSerialized>;
  lines: Array<ChatLine>;
};

interface UserPublic {
  actorId: ActorID;
  color: number;
  username: string;
}

interface UserPrivate {
  activeConnections: number;
  assetId: number;
  roomId: RoomID;
  savedPosition: { x: number; y: number; z: number };
}

type User = UserPublic & UserPrivate;

interface ChatLine {
  color: number;
  lineId: number;
  message: string;
  time: number;
  username: string;
}

const NUMBER_ASSETS = 10;

const rooms: Record<RoomID, Room> = {};
const users: Record<UserID, User> = {};
const actorsToUsers: Record<ActorID, User> = {};

function getRandomInt(min: number, max: number): number {
  min = Math.ceil(min);
  max = Math.floor(max);
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function getRandomPosition(): number {
  return Math.random() * 3 - 1.5;
}

function getUser(userId: UserID): User {
  return users[userId];
}

function getUserOrThrow(userId: UserID): User {
  const user = getUser(userId);
  if (user) {
    return user;
  }
  throw new Error(`Invalid userId: ${userId}`);
}

function getRoom(roomId: RoomID): Room | null {
  return rooms[roomId];
}

function getRoomOrThrow(roomId: RoomID): Room {
  const room = getRoom(roomId);
  if (room) {
    return room;
  }
  throw new Error(`Invalid roomId: ${roomId}`);
}

// This should load the scene from a store or cache, but right now simply
// initializes it with some default props
function loadScene(roomId: RoomID): IMasterScene<WirePlaceSceneSerialized> {
  return createDefaultScene();
}

function getOrCreateRoom(roomId: RoomID): Room {
  let room = getRoom(roomId);
  if (room) {
    return room;
  }

  room = {
    scene: loadScene(roomId),
    lines: [],
  };
  logger.info({ event: 'new room', roomId, sceneVersion: room.scene.version });
  rooms[roomId] = room;
  return room;
}

function join(
  userId: UserID,
  username: string,
  roomId: string
): { actorId: ActorID; username: string } {
  const { scene } = getOrCreateRoom(roomId);
  const user = getUser(userId);
  if (user) {
    const actor = scene.getActor(user.actorId);
    const { username, actorId } = user;
    if (!actor) {
      // Recreate previously destroyed actor
      const { savedPosition, color, assetId } = user;
      scene.addActor(actorId);
      scene.updateActor(actorId, {
        color,
        position: savedPosition,
        assetId,
        action: { state: -1, type: 1 },
      });
    }
    user.activeConnections += 1;
    return { actorId, username };
  }

  const actorId = scene.nextActorID();
  const colorHex =
    schemeCategory10[getRandomInt(0, schemeCategory10.length - 1)];
  const color = parseInt(colorHex.substr(1), 16);
  const assetId = getRandomInt(0, NUMBER_ASSETS - 1);
  const position = { x: getRandomPosition(), y: 0, z: getRandomPosition() };
  scene.addActor(actorId);
  scene.updateActor(actorId, { color, position, assetId });
  const userRecord = {
    activeConnections: 1,
    actorId,
    color,
    username,
    assetId,
    roomId,
    savedPosition: { x: 0, y: 0, z: 0 },
  };
  users[userId] = userRecord;
  actorsToUsers[actorId] = userRecord;
  return { actorId, username };
}

function spawn(userId: UserID, roomId: RoomID, assetId: number) {
  const { scene } = getRoomOrThrow(roomId);
  const actorId = scene.nextActorID();
  scene.addActor(actorId);
  scene.updateActor(actorId, { assetId, movable: true });
}

function joinAudio(userId: UserID, roomId: string): string {
  const userRecord = users[userId];
  if (!userRecord) {
    throw new Error('Invalid user');
  }
  const { actorId } = userRecord;
  const currentTimestamp = Math.floor(Date.now() / 1000);
  const expirationTimestamp = currentTimestamp + 3600;
  const agoraToken = RtcTokenBuilder.buildTokenWithAccount(
    AGORA_APP_ID,
    AGORO_CERTIFICATE,
    roomId,
    actorId,
    RtcRole.PUBLISHER,
    expirationTimestamp
  );
  return agoraToken;
}

function leave(userId: UserID) {
  const user = users[userId];
  user.activeConnections = Math.max(0, user.activeConnections - 1);
  const { actorId, roomId } = user;
  const room = getRoom(roomId);
  if (room && user.activeConnections === 0) {
    const { scene } = room;
    const actor = scene.getActorOrThrow(actorId);
    if (actor) {
      user.savedPosition.x = actor.position.x;
      user.savedPosition.y = actor.position.y;
      user.savedPosition.z = actor.position.z;
      user.assetId = actor.assetId;
      scene.removeActor(actorId);
    }
  }
}

function sync(userId: UserID): WirePlaceSceneSerialized {
  const { roomId } = getUserOrThrow(userId);
  const room = getRoom(roomId);
  if (room) {
    const { scene } = room;
    const { data } = scene.retrieveSerializedDiff(true);
    return data;
  }
  throw new Error(`Invalid roomId: ${roomId}`);
}

function getUpdate(roomId: RoomID): WirePlaceSceneSerialized | null {
  const room = getRoom(roomId);
  if (room) {
    const { scene } = room;
    const { count, data } = scene.retrieveSerializedDiff(false);
    return count > 0 ? data : null;
  }
  return null;
}

function getUpdates(): Record<RoomID, WirePlaceSceneSerialized> {
  const updates: Record<RoomID, WirePlaceSceneSerialized> = {};
  for (const roomId in rooms) {
    const update = getUpdate(roomId);
    if (update) {
      updates[roomId] = update;
    }
  }
  return updates;
}

function getPublicUser(actorId: string): UserPublic | undefined {
  const user = actorsToUsers[actorId];
  if (!user) {
    return undefined;
  }
  const { username, color } = user;
  return { username, color, actorId };
}

function getPublicUsers(
  userId: string,
  actorIds: Array<ActorID>
): Record<ActorID, UserPublic> {
  const results: Record<ActorID, UserPublic> = {};
  for (const actorId of actorIds) {
    const user = getPublicUser(actorId);
    if (user) {
      results[actorId] = user;
    }
  }
  return results;
}

const INITIAL_CHAT_HISTORY = 10;

function getChatHistory(userId: string): Array<ChatLine> {
  const { roomId } = getUserOrThrow(userId);
  const { lines } = getRoomOrThrow(roomId);
  return lines.slice(-INITIAL_CHAT_HISTORY);
}

function move(userId: UserID, movedActorId: ActorID, u: Update) {
  const { actorId, roomId } = getUserOrThrow(userId);
  const { scene } = getRoomOrThrow(roomId);

  if (movedActorId === actorId) {
    return scene.updateActor(actorId, u);
  } else {
    // TODO: check user permission to move object
    return scene.updateActor(movedActorId, u);
  }
}

function say(
  userId: UserID,
  message: string
): { roomId: RoomID; line: ChatLine } {
  const time = Date.now();
  const { username, color, roomId } = getUserOrThrow(userId);
  const { lines } = getRoomOrThrow(roomId);
  const lineId = nextLineId;
  const line: ChatLine = { lineId, time, username, message, color };
  lines.push(line);
  nextLineId += 1;
  return { roomId, line };
}

export {
  leave,
  move,
  join,
  joinAudio,
  sync,
  getUpdates,
  getPublicUsers,
  getChatHistory,
  say,
  spawn,
};
