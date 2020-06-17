import admin from 'firebase-admin';
import cors from 'cors';
import eetase from 'eetase';
import express, { Response } from 'express';
import bodyParser from 'body-parser';
import fs from 'fs';
import http from 'http';
import https from 'https';
import morgan from 'morgan';
import path from 'path';
import sccBrokerClient from 'scc-broker-client';
import serveStatic from 'serve-static';
import socketClusterServer from 'socketcluster-server';
import uuid from 'uuid';

import { UserPermissions } from './constants';
import logger from './logger';
import * as wireplace from './wireplace';

const serviceAccount = require('../firebase-service-key.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: 'https://wire-place.firebaseio.com',
});

const serverLogger = logger.child({ module: 'server' });

const UPDATE_FPS = 3;

const ENVIRONMENT = process.env.ENV || 'dev';
const SOCKETCLUSTER_PORT =
  (process.env.SOCKETCLUSTER_PORT
    ? parseInt(process.env.SOCKETCLUSTER_PORT, 10)
    : undefined) || 8000;
const SOCKETCLUSTER_WS_ENGINE = process.env.SOCKETCLUSTER_WS_ENGINE || 'ws';
const SOCKETCLUSTER_SOCKET_CHANNEL_LIMIT =
  Number(process.env.SOCKETCLUSTER_SOCKET_CHANNEL_LIMIT) || 1000;
const SOCKETCLUSTER_LOG_LEVEL = process.env.SOCKETCLUSTER_LOG_LEVEL || 2;

const SCC_INSTANCE_ID = uuid.v4();
const SCC_STATE_SERVER_HOST = process.env.SCC_STATE_SERVER_HOST || undefined;
const SCC_STATE_SERVER_PORT = process.env.SCC_STATE_SERVER_PORT
  ? parseInt(process.env.SCC_STATE_SERVER_PORT, 10)
  : undefined;
const SCC_MAPPING_ENGINE = process.env.SCC_MAPPING_ENGINE || undefined;
const SCC_CLIENT_POOL_SIZE = process.env.SCC_CLIENT_POOL_SIZE
  ? parseInt(process.env.SCC_CLIENT_POOL_SIZE, 10)
  : undefined;
const SCC_AUTH_KEY = process.env.SCC_AUTH_KEY || undefined;
const SCC_INSTANCE_IP = process.env.SCC_INSTANCE_IP || undefined;
const SCC_INSTANCE_IP_FAMILY = process.env.SCC_INSTANCE_IP_FAMILY || undefined;
const SCC_STATE_SERVER_CONNECT_TIMEOUT =
  Number(process.env.SCC_STATE_SERVER_CONNECT_TIMEOUT) || undefined;
const SCC_STATE_SERVER_ACK_TIMEOUT =
  Number(process.env.SCC_STATE_SERVER_ACK_TIMEOUT) || undefined;
const SCC_STATE_SERVER_RECONNECT_RANDOMNESS =
  Number(process.env.SCC_STATE_SERVER_RECONNECT_RANDOMNESS) || undefined;
const SCC_PUB_SUB_BATCH_DURATION =
  Number(process.env.SCC_PUB_SUB_BATCH_DURATION) || undefined;
const SCC_BROKER_RETRY_DELAY =
  Number(process.env.SCC_BROKER_RETRY_DELAY) || undefined;

let agOptions = {};

if (process.env.SOCKETCLUSTER_OPTIONS) {
  let envOptions = JSON.parse(process.env.SOCKETCLUSTER_OPTIONS);
  Object.assign(agOptions, envOptions);
}

let httpServer = eetase(http.createServer());

if (ENVIRONMENT === 'prod') {
  const cert = process.env.WIREPLACE_SSL_CERT;
  const key = process.env.WIREPLACE_SSL_KEY;

  if (!cert || !key) {
    throw new Error('Missing SSL cert');
  }

  const options = {
    key: fs.readFileSync(key),
    cert: fs.readFileSync(cert),
  };
  httpServer = eetase(https.createServer(options));
}

let agServer = socketClusterServer.attach(httpServer, agOptions);

let expressApp = express();
if (ENVIRONMENT === 'dev') {
  // Log every HTTP request. See https://github.com/expressjs/morgan for other
  // available formats.
  expressApp.use(morgan('dev'));
}
expressApp.use(cors());
expressApp.use(bodyParser.json());
expressApp.use(serveStatic(path.resolve(__dirname, 'public')));

function sendResponse(res: Response<any>, code: number, data: Object) {
  serverLogger.info({ event: 'http-response', code, data });
  res.status(code).send(data);
}

// Add GET /health-check express route
expressApp.get('/health-check', (req, res) => {
  res.status(200).send('OK');
});

expressApp.post('/manual-login', async (req, res) => {
  const { username, uuid } = req.body;
  serverLogger.info({ event: 'login-uuid', uuid, username });

  const tokenData = {
    uid: uuid,
    username,
  };

  const { signatureKey } = agServer;
  if (!signatureKey) {
    serverLogger.error({ message: 'Missing auth key', uuid });
    sendResponse(res, 500, { message: 'Server error', uuid });
    return;
  }

  const token = await agServer.auth.signToken(tokenData, signatureKey);
  sendResponse(res, 200, { uuid, token });
});

expressApp.post('/login', async (req, res) => {
  const { authorization } = req.headers;

  if (!authorization || !authorization.startsWith('Bearer ')) {
    serverLogger.info({ event: 'invalid-firebase-token', authorization });
    res.status(400).send({ message: 'Invalid Firebase token' });
    return;
  }

  const firebaseToken = authorization.substr('Bearer '.length);
  const decodedToken = await admin.auth().verifyIdToken(firebaseToken);
  const { uid, email } = decodedToken;
  serverLogger.info({ event: 'login-firestore', uid, email });

  const user = (
    await admin.firestore().collection('users').doc(uid).get()
  ).data();

  if (!user) {
    sendResponse(res, 200, { uid, token: null, error: 'NEW_USER' });
    return;
  }

  const { username, permission } = user;
  if (!username) {
    sendResponse(res, 200, { uid, token: null, error: 'NEW_USER' });
    return;
  }

  if (!permission || permission === UserPermissions.WAITLIST) {
    const waitlist = (
      await admin.firestore().collection('settings').doc('waitlist').get()
    ).data();
    const waitlistEnabled = !waitlist || waitlist.enabled;
    serverLogger.info({ event: 'waitlist', permission, waitlistEnabled });

    if (waitlistEnabled) {
      sendResponse(res, 200, { uid, token: null, error: 'ON_WAITLIST' });
      return;
    }
  }

  const tokenData = {
    email,
    username,
    uid,
  };

  const { signatureKey } = agServer;
  if (!signatureKey) {
    serverLogger.error({ message: 'Missing auth key', uid });
    sendResponse(res, 500, { message: 'Server error', uid });
    return;
  }

  const token = await agServer.auth.signToken(tokenData, signatureKey);
  sendResponse(res, 200, { uid, token });
});

// HTTP request handling loop.
(async () => {
  for await (let requestData of httpServer.listener('request')) {
    expressApp.apply(null, requestData);
  }
})();

// SocketCluster/WebSocket connection handling loop.
(async () => {
  let intervalId: NodeJS.Timeout | undefined = undefined;

  for await (let { socket } of agServer.listener('connection')) {
    serverLogger.info({ event: 'connection', socket: socket.id });

    (async () => {
      for await (let request of socket.procedure('join')) {
        try {
          const { roomId } = request.data;
          serverLogger.info({
            authToken: request.socket.authToken,
            socket: request.socket.id,
          });
          const { username, uid, email } = request.socket.authToken;

          const actorId = wireplace.join(
            uid,
            request.socket.id,
            username,
            roomId
          );
          serverLogger.info({
            event: 'join',
            username,
            email,
            roomId,
            socket: socket.id,
          });

          request.end(actorId);
        } catch (error) {
          serverLogger.error({ error });
        }
      }
    })();

    (async () => {
      for await (let request of socket.procedure('joinAudio')) {
        try {
          const { roomId } = request.data;
          const { username, uid } = request.socket.authToken;
          const agoraToken = wireplace.joinAudio(uid, roomId);
          serverLogger.info({
            event: 'join',
            username,
            roomId,
            socket: socket.id,
          });
          request.end(agoraToken);
        } catch (error) {
          serverLogger.error({ error });
        }
      }
    })();

    (async () => {
      for await (let request of socket.procedure('sync')) {
        try {
          const { uid } = request.socket.authToken;
          const { roomId } = request.data;
          serverLogger.info({
            event: 'sync',
            uid,
            roomId,
            socket: socket.id,
          });
          const diff = wireplace.sync(uid, roomId);
          request.end(diff);
        } catch (error) {
          serverLogger.error({ error });
        }
      }
    })();

    (async () => {
      for await (let request of socket.procedure('getRoomUsers')) {
        try {
          const { uid } = request.socket.authToken;
          const { roomId, query } = request.data;
          const user = wireplace.getRoomUsers(uid, roomId, query);
          request.end(user);
        } catch (error) {
          serverLogger.error({ error });
        }
      }
    })();

    (async () => {
      for await (let request of socket.procedure('getChatHistory')) {
        try {
          const { uid } = request.socket.authToken;
          const { roomId } = request.data;
          const lines = wireplace.getChatHistory(uid, roomId);
          request.end(lines);
        } catch (error) {
          serverLogger.error({ error });
        }
      }
    })();

    (async () => {
      for await (let request of socket.procedure('spawn')) {
        try {
          const { assetId, roomId } = request.data;
          const { uid } = request.socket.authToken;
          const actorId = wireplace.spawn(uid, roomId, assetId);

          serverLogger.info({
            event: 'spawn',
            uid,
            roomId,
            socket: socket.id,
            assetId,
            actorId,
          });

          request.end(true);
        } catch (error) {
          serverLogger.error({ error });
        }
      }
    })();

    (async () => {
      for await (let request of socket.procedure('remove')) {
        try {
          const { actorId, roomId } = request.data;
          const { uid } = request.socket.authToken;
          const success = wireplace.remove(uid, roomId, actorId);
          serverLogger.info({
            event: 'remove',
            uid,
            roomId,
            socket: socket.id,
            actorId,
            success,
          });
          request.end(success);
        } catch (error) {
          serverLogger.error({ error });
        }
      }
    })();

    (async () => {
      for await (let { message, roomId } of socket.receiver('say')) {
        try {
          if (!socket.authToken) {
            throw new Error('Missing auth token');
          }
          const { uid } = socket.authToken;
          const { line } = wireplace.say(uid, roomId, message);
          if (line) {
            serverLogger.info({
              event: 'say',
              line,
              roomId,
              socket: socket.id,
            });
            socket.exchange.transmitPublish('said:' + roomId, line);
          }
        } catch (error) {
          serverLogger.error({ error });
        }
      }
    })();

    (async () => {
      for await (let { actorId, roomId, update } of socket.receiver('move')) {
        try {
          if (!socket.authToken) {
            throw new Error('Missing auth token');
          }
          const { uid } = socket.authToken;
          wireplace.move(uid, roomId, actorId, update);
        } catch (error) {
          serverLogger.error({ error });
        }
      }
    })();

    intervalId = setInterval(() => {
      const diffs = wireplace.getUpdates();
      for (const roomId in diffs) {
        const diff = diffs[roomId];
        socket.exchange.transmitPublish('update:' + roomId, diff);
      }
    }, 1000 / UPDATE_FPS);
  }

  if (intervalId) {
    clearInterval(intervalId);
  }
  serverLogger.info('Main loop terminated');
})();

(async () => {
  for await (let { socket } of agServer.listener('closure')) {
    serverLogger.info({
      event: 'closure',
      socket: socket.id,
      authToken: socket.authToken,
    });
    try {
      if (!socket.authToken) {
        throw new Error('Missing auth token');
      }
      const { uid } = socket.authToken;
      const { roomId, left } = wireplace.leave(uid, socket.id);
      serverLogger.info({
        event: 'leave',
        userId: uid,
        roomId,
        left,
      });
    } catch (error) {
      serverLogger.error({ error });
    }
  }
})();

httpServer.listen(SOCKETCLUSTER_PORT);

if (SOCKETCLUSTER_LOG_LEVEL >= 1) {
  (async () => {
    for await (let { error } of agServer.listener('error')) {
      serverLogger.error({ error });
    }
  })();
}

if (SOCKETCLUSTER_LOG_LEVEL >= 2) {
  serverLogger.info({
    process: process.pid,
    port: SOCKETCLUSTER_PORT,
  });

  (async () => {
    for await (let { warning } of agServer.listener('warning')) {
      serverLogger.warn({ warning });
    }
  })();
}

if (SCC_STATE_SERVER_HOST) {
  // Setup broker client to connect to SCC.
  let sccClient = sccBrokerClient.attach(agServer.brokerEngine, {
    instanceId: SCC_INSTANCE_ID,
    instancePort: SOCKETCLUSTER_PORT,
    instanceIp: SCC_INSTANCE_IP,
    instanceIpFamily: SCC_INSTANCE_IP_FAMILY,
    pubSubBatchDuration: SCC_PUB_SUB_BATCH_DURATION,
    stateServerHost: SCC_STATE_SERVER_HOST,
    stateServerPort: SCC_STATE_SERVER_PORT,
    mappingEngine: <any>SCC_MAPPING_ENGINE,
    clientPoolSize: SCC_CLIENT_POOL_SIZE,
    authKey: SCC_AUTH_KEY,
    stateServerConnectTimeout: SCC_STATE_SERVER_CONNECT_TIMEOUT,
    stateServerAckTimeout: SCC_STATE_SERVER_ACK_TIMEOUT,
    stateServerReconnectRandomness: SCC_STATE_SERVER_RECONNECT_RANDOMNESS,
    brokerRetryDelay: SCC_BROKER_RETRY_DELAY,
  });

  if (SOCKETCLUSTER_LOG_LEVEL >= 1) {
    (async () => {
      for await (let { error } of sccClient.listener('error')) {
        error.name = 'SCCError';
        serverLogger.error(error);
      }
    })();
  }
}
