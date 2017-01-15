/* @flow */

// $FlowIssue
// eslint-disable-next-line no-undef
onconnect = function (e) {
  const port = e.ports[0];
  port.onmessage = function (e) {
    handleMessage(e.data, port);
  };
};

import {create as createDefered} from '../defered';
import type {Defered} from '../defered';

import type {MessageFromSharedWorker, MessageToSharedWorker} from './withSharedConnections';

// path => session
const state: {[path: string]: string} = {};

let lock: ?Defered<Object> = null;
let waitPromise: Promise<void> = Promise.resolve();

type PortObject = {postMessage: (message: Object) => void};

function startLock(): void {
  const newLock = createDefered();
  lock = newLock;
  setTimeout(() => newLock.reject(new Error(`Timed out`)), 10 * 1000);
}

function releaseLock(obj: Object): void {
  if (lock == null) {
    // TODO: ???
    return;
  }
  lock.resolve(obj);
}

function waitForLock(): Promise<any> {
  if (lock == null) {
    // TODO: ???
    return Promise.reject(new Error(`???`));
  }
  return lock.promise;
}

function waitInQueue(fn: () => Promise<void>) {
  const res = waitPromise.then(() => fn());
  waitPromise = res.catch(() => {});
}

function handleMessage({id, message}: {id: number, message: MessageToSharedWorker}, port: PortObject) {
  if (message.type === `acquire-intent`) {
    const path: string = message.path;
    const checkPrevious: boolean = message.checkPrevious;
    const previous: ?string = message.previous;
    waitInQueue(() => handleAcquireIntent(path, checkPrevious, previous, id, port));
  }
  if (message.type === `acquire-done`) {
    const session: string = message.session;
    handleAcquireDone(session, id); // port is the same as original
  }
  if (message.type === `acquire-failed`) {
    handleAcquireFailed(id); // port is the same as original
  }
  if (message.type === `get-sessions`) {
    waitInQueue(() => handleGetSessions(id, port));
  }
  if (message.type === `release-intent`) {
    waitInQueue(() => handleReleaseIntent(id, port));
  }
  if (message.type === `release-done`) {
    const path: string = message.path;
    handleReleaseDone(path, id); // port is the same as original
  }
  if (message.type === `release-failed`) {
    handleReleaseFailed(id); // port is the same as original
  }
}

function handleReleaseDone(
  path: string,
  id: number
) {
  releaseLock({path, id});
}

function handleReleaseFailed(
  id: number
) {
  releaseLock({id});
}

function handleReleaseIntent(
    id: number,
    port: PortObject
): Promise<void> {
  startLock();
  sendBack({type: `ok`}, id, port);
  // if lock times out, promise rejects and queue goes on
  return waitForLock().then((obj: {path: ?string, id: number}) => {
    if (obj.path != null) {
      // failure => nothing happens, but still has to reply "ok"
      delete state[obj.path];
    }
    sendBack({type: `ok`}, obj.id, port);
  });
}

function handleGetSessions(
  id: number,
  port: PortObject
): Promise<void> {
  sendBack({type: `sessions`, sessions: state}, id, port);
  return Promise.resolve();
}

function handleAcquireDone(
  session: string,
  id: number
) {
  releaseLock({session, id});
}

function handleAcquireFailed(
  id: number
) {
  releaseLock({id});
}

function handleAcquireIntent(
    path: string,
    checkPrevious: boolean,
    previous: ?string,
    id: number,
    port: PortObject
): Promise<void> {
  let error = false;
  if (checkPrevious) {
    const realPrevious = state[path];

    if (realPrevious == null) {
      error = (previous != null);
    } else {
      error = (previous !== realPrevious);
    }
  }
  if (error) {
    sendBack({type: `wrong-previous-session`}, id, port);
    return Promise.resolve();
  } else {
    startLock();
    sendBack({type: `ok`}, id, port);
    // if lock times out, promise rejects and queue goes on
    return waitForLock().then((obj: {session: ?string, id: number}) => {
      if (obj.session != null) {
        // failure => nothing happens, but still has to reply "ok"
        state[path] = obj.session;
      }
      sendBack({type: `ok`}, obj.id, port);
    });
  }
}

function sendBack(message: MessageFromSharedWorker, id: number, port: PortObject) {
  port.postMessage({id, message});
}

