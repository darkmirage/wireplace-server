import eetase from 'eetase';
import express, { request } from 'express';
import fs from 'fs';
import http from 'http';
import https from 'https';
import morgan from 'morgan';
import path from 'path';
import sccBrokerClient from 'scc-broker-client';
import serveStatic from 'serve-static';
import socketClusterServer from 'socketcluster-server';
import uuid from 'uuid';

import logger from './logger';
import * as wireplace from './wireplace';

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
expressApp.use(serveStatic(path.resolve(__dirname, 'public')));

// Add GET /health-check express route
expressApp.get('/health-check', (req, res) => {
  res.status(200).send('OK');
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
    // Handle socket connection.
    serverLogger.info({ event: 'connection', socket: socket.id });

    (async () => {
      for await (let request of socket.procedure('join')) {
        const { username, token, channel } = request.data;
        const actorId = wireplace.join(socket.id, username, channel, token);
        const agoraToken = wireplace.joinAudio(socket.id, channel);
        serverLogger.info({
          event: 'join',
          username,
          channel,
          token,
          socket: socket.id,
        });
        request.end(actorId);
      }
    })();

    (async () => {
      for await (let request of socket.procedure('joinAudio')) {
        const { username, token, channel } = request.data;
        const agoraToken = wireplace.joinAudio(socket.id, channel);
        serverLogger.info({
          event: 'join',
          username,
          channel,
          token,
          socket: socket.id,
        });
        request.end(agoraToken);
      }
    })();

    (async () => {
      for await (let request of socket.procedure('sync')) {
        const diff = wireplace.sync(socket.id);
        request.end(diff);
      }
    })();

    (async () => {
      for await (let request of socket.procedure('user')) {
        const user = wireplace.getUsers(request.data);
        request.end(user);
      }
    })();

    (async () => {
      for await (let data of socket.receiver('say')) {
        const line = wireplace.say(socket.id, data);
        if (line) {
          serverLogger.info({ event: 'say', line, socket: socket.id });
          socket.exchange.transmitPublish('said', line);
        }
      }
    })();

    (async () => {
      for await (let data of socket.receiver('move')) {
        wireplace.move(socket.id, data);
      }
    })();

    intervalId = setInterval(() => {
      const diff = wireplace.getUpdate();
      if (!diff) {
        return;
      }
      socket.exchange.transmitPublish('update', diff);
    }, 1000 / UPDATE_FPS);
  }

  if (intervalId) {
    clearInterval(intervalId);
  }
  serverLogger.info('Main loop terminated');
})();

(async () => {
  for await (let { socket } of agServer.listener('closure')) {
    // Handle socket connection.
    serverLogger.info({ event: 'closure', socket: socket.id });
    wireplace.leave(socket.id);
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
