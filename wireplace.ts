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
  users: Record<UserID, RoomUser>;
  lines: Array<ChatLine>;
};

interface UserPublic {
  color: number;
  username: string;
  userId: UserID;
}

interface RoomUser {
  username: string;
  actorId: ActorID;
  activeConnections: number;
  assetId: number;
  roomId: RoomID;
  savedPosition: { x: number; y: number; z: number };
}

type User = UserPublic;

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
const socketsToRooms: Record<string, RoomID> = {};

function getRandomInt(min: number, max: number): number {
  min = Math.ceil(min);
  max = Math.floor(max);
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function getRandomPosition(): number {
  return Math.random() * 3 - 1.5;
}

function getUser(userId: UserID): User | undefined {
  return users[userId];
}

function getUserOrThrow(userId: UserID): User {
  const user = getUser(userId);
  if (user) {
    return user;
  }
  throw new Error(`Invalid userId: ${userId}`);
}

function getRoomUserOrThrow(roomId: RoomID, userId: UserID): RoomUser {
  const room = getRoomOrThrow(roomId);
  const user = room.users[userId];
  if (user) {
    return user;
  }
  throw new Error('User is not in the room');
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
    users: {},
  };
  logger.info({ event: 'new room', roomId, sceneVersion: room.scene.version });
  rooms[roomId] = room;
  return room;
}

function join(
  userId: UserID,
  socketId: string,
  username: string,
  roomId: string
): { actorId: ActorID; username: string } {
  socketsToRooms[socketId] = roomId;
  const room = getOrCreateRoom(roomId);
  const { scene } = room;
  const user = getUser(userId);
  const roomUser = room.users[userId];

  if (user && roomUser) {
    const { actorId } = roomUser;
    const actor = scene.getActor(actorId);
    if (!actor) {
      // Recreate previously destroyed actor
      const { savedPosition, assetId } = roomUser;
      const { color } = user;
      scene.addActor(actorId);
      scene.updateActor(actorId, {
        color,
        position: savedPosition,
        assetId,
        action: { state: -1, type: 1 },
      });
    }
    roomUser.activeConnections += 1;
    return { actorId, username };
  }

  const actorId = scene.nextActorID();
  const colorHex =
    schemeCategory10[getRandomInt(0, schemeCategory10.length - 1)];
  const color = user ? user.color : parseInt(colorHex.substr(1), 16);
  const assetId = getRandomInt(0, NUMBER_ASSETS - 1);
  const position = { x: getRandomPosition(), y: 0, z: getRandomPosition() };
  scene.addActor(actorId);
  scene.updateActor(actorId, { color, position, assetId });
  const userRecord = {
    userId,
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
  room.users[userId] = userRecord;

  return { actorId, username };
}

function spawn(userId: UserID, roomId: RoomID, assetId: number): ActorID {
  const { scene } = getRoomOrThrow(roomId);
  const actorId = scene.nextActorID();
  scene.addActor(actorId);
  scene.updateActor(actorId, { assetId, movable: true });
  return actorId;
}

function joinAudio(userId: UserID, roomId: string): string {
  const room = getRoomOrThrow(roomId);
  const roomUser = room.users[userId];
  if (!roomUser) {
    throw new Error('Invalid user');
  }

  const { actorId } = roomUser;
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

function leave(
  userId: UserID,
  socketId: string
): { roomId: RoomID; left: boolean } {
  const roomId = socketsToRooms[socketId];
  const room = getRoomOrThrow(roomId);
  const roomUser = room.users[userId];
  if (!roomUser) {
    throw new Error('Invalid user');
  }

  roomUser.activeConnections = Math.max(0, roomUser.activeConnections - 1);
  const { actorId } = roomUser;

  if (roomUser.activeConnections === 0) {
    const { scene } = room;
    const actor = scene.getActorOrThrow(actorId);
    roomUser.savedPosition.x = actor.position.x;
    roomUser.savedPosition.y = actor.position.y;
    roomUser.savedPosition.z = actor.position.z;
    roomUser.assetId = actor.assetId;
    scene.removeActor(actorId);
  }

  return { roomId, left: roomUser.activeConnections === 0 };
}

function remove(userId: UserID, roomId: RoomID, actorId: string): boolean {
  const { scene } = getRoomOrThrow(roomId);
  return scene.removeActor(actorId);
}

function sync(userId: UserID, roomId: RoomID): WirePlaceSceneSerialized {
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

function getRoomUsers(
  userId: UserID,
  roomId: RoomID,
  actorIds: Array<ActorID>
): Record<ActorID, RoomUser> {
  const results: Record<ActorID, RoomUser> = {};
  const room = getRoomOrThrow(roomId);
  for (const actorId of actorIds) {
    const user = actorsToUsers[actorId];
    if (!user) {
      continue;
    }
    const roomUser = room.users[user.userId];
    if (!roomUser) {
      continue;
    }

    results[actorId] = roomUser;
  }
  return results;
}

const INITIAL_CHAT_HISTORY = 10;

function getChatHistory(userId: string, roomId: RoomID): Array<ChatLine> {
  const room = getRoomOrThrow(roomId);
  if (userId in room.users) {
    return room.lines.slice(-INITIAL_CHAT_HISTORY);
  }
  throw new Error('User is not in the room');
}

function move(
  userId: UserID,
  roomId: RoomID,
  movedActorId: ActorID,
  u: Update
) {
  const { actorId } = getRoomUserOrThrow(roomId, userId);
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
  roomId: RoomID,
  message: string
): { roomId: RoomID; line: ChatLine } {
  const time = Date.now();
  const { username, color } = getUserOrThrow(userId);
  const { lines } = getRoomOrThrow(roomId);
  const lineId = nextLineId;
  const line: ChatLine = { lineId, time, username, message, color };
  lines.push(line);
  nextLineId += 1;
  return { roomId, line };
}

export {
  getChatHistory,
  getRoomUsers,
  getUpdates,
  join,
  joinAudio,
  leave,
  move,
  remove,
  say,
  spawn,
  sync,
};
