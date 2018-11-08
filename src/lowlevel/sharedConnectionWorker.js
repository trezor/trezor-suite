/* @flow */

// To ensure that two website don't read from/to Trezor at the same time, I need a sharedworker
// to synchronize them.
// However, sharedWorker cannot directly use webusb API... so I need to send messages
// about intent to acquire/release and then send another message when that is done.
// Other windows then can acquire/release

// eslint-disable-next-line no-undef
// $FlowIssue
if (typeof onconnect !== `undefined`) {
  // eslint-disable-next-line no-undef
  onconnect = function (e) {
    const port = e.ports[0];
    port.onmessage = function (e) {
      handleMessage(e.data, port);
    };
  };
}

import {create as createDefered} from '../defered';
import type {Defered} from '../defered';

import type {TrezorDeviceInfoDebug} from './sharedPlugin';
import type {MessageFromSharedWorker, MessageToSharedWorker} from './withSharedConnections';

// path => session
const normalSessions: {[path: string]: string} = {};
const debugSessions: {[path: string]: string} = {};

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
    const previous: ?string = message.previous;
    const debug: boolean = message.debug;
    waitInQueue(() => handleAcquireIntent(path, previous, debug, id, port));
  }
  if (message.type === `acquire-done`) {
    handleAcquireDone(id); // port is the same as original
  }
  if (message.type === `acquire-failed`) {
    handleAcquireFailed(id); // port is the same as original
  }
  if (message.type === `get-sessions`) {
    waitInQueue(() => handleGetSessions(id, port));
  }

  if (message.type === `get-sessions-and-disconnect`) {
    const devices = message.devices;
    waitInQueue(() => handleGetSessions(id, port, devices));
  }

  if (message.type === `release-onclose`) {
    const session: string = message.session;
    waitInQueue(() => handleReleaseOnClose(session));
  }

  if (message.type === `release-intent`) {
    const session: string = message.session;
    const debug: bool = message.debug;
    waitInQueue(() => handleReleaseIntent(session, debug, id, port));
  }
  if (message.type === `release-done`) {
    handleReleaseDone(id); // port is the same as original
  }
  if (message.type === `enumerate-intent`) {
    waitInQueue(() => handleEnumerateIntent(id, port));
  }
  if (message.type === `enumerate-done`) {
    handleReleaseDone(id); // port is the same as original
  }
}

function handleEnumerateIntent(
  id: number,
  port: PortObject
): Promise<void> {
  startLock();
  sendBack({type: `ok`}, id, port);

  // if lock times out, promise rejects and queue goes on
  return waitForLock().then((obj: {id: number}) => {
    sendBack({type: `ok`}, obj.id, port);
  });
}

function handleReleaseDone(
  id: number
) {
  releaseLock({id});
}

function handleReleaseOnClose(
  session: string,
): Promise<void> {
  let path_: ?string = null;
  Object.keys(normalSessions).forEach(kpath => {
    if (normalSessions[kpath] === session) {
      path_ = kpath;
    }
  });
  if (path_ == null) {
    return Promise.resolve();
  }

  const path: string = path_;
  delete normalSessions[path];
  delete debugSessions[path];
  return Promise.resolve();
}

function handleReleaseIntent(
  session: string,
  debug: boolean,
  id: number,
  port: PortObject
): Promise<void> {
  let path_: ?string = null;
  const sessions = debug ? debugSessions : normalSessions;
  const otherSessions = (!debug) ? debugSessions : normalSessions;
  Object.keys(sessions).forEach(kpath => {
    if (sessions[kpath] === session) {
      path_ = kpath;
    }
  });
  if (path_ == null) {
    sendBack({type: `double-release`}, id, port);
    return Promise.resolve();
  }

  const path: string = path_;

  const otherSession = otherSessions[path];

  startLock();
  sendBack({type: `path`, path, otherSession}, id, port);

  // if lock times out, promise rejects and queue goes on
  return waitForLock().then((obj: {id: number}) => {
    // failure => nothing happens, but still has to reply "ok"
    delete sessions[path];
    sendBack({type: `ok`}, obj.id, port);
  });
}

function handleGetSessions(
  id: number,
  port: PortObject,
  devices: ?Array<TrezorDeviceInfoDebug>
): Promise<void> {
  if (devices != null) {
    const connected: {[path: string]: boolean} = {};
    devices.forEach(d => { connected[d.path] = true; });
    Object.keys(normalSessions).forEach(path => {
      if (!normalSessions[path]) {
        delete normalSessions[path];
      }
    });
    Object.keys(debugSessions).forEach(path => {
      if (!debugSessions[path]) {
        delete debugSessions[path];
      }
    });
  }
  sendBack({type: `sessions`, debugSessions, normalSessions}, id, port);
  return Promise.resolve();
}

let lastSession = 0;
function handleAcquireDone(
  id: number
) {
  releaseLock({good: true, id});
}

function handleAcquireFailed(
  id: number
) {
  releaseLock({good: false, id});
}

function handleAcquireIntent(
  path: string,
  previous: ?string,
  debug: boolean,
  id: number,
  port: PortObject
): Promise<void> {
  let error = false;
  const thisTable = debug ? debugSessions : normalSessions;
  const otherTable = (!debug) ? debugSessions : normalSessions;
  const realPrevious = thisTable[path];

  if (realPrevious == null) {
    error = (previous != null);
  } else {
    error = (previous !== realPrevious);
  }
  if (error) {
    sendBack({type: `wrong-previous-session`}, id, port);
    return Promise.resolve();
  } else {
    startLock();
    sendBack({type: `other-session`, otherSession: otherTable[path]}, id, port);
    // if lock times out, promise rejects and queue goes on
    return waitForLock().then((obj: {good: boolean, id: number}) => {
      if (obj.good) {
        lastSession++;
        let session = lastSession.toString();
        if (debug) {
          session = `debug` + session;
        }
        thisTable[path] = session;
        sendBack({type: `session-number`, number: session}, obj.id, port);
      } else {
        // failure => nothing happens, but still has to reply "ok"
        sendBack({type: `ok`}, obj.id, port);
      }
    });
  }
}

function sendBack(message: MessageFromSharedWorker, id: number, port: PortObject) {
  port.postMessage({id, message});
}

// when shared worker is not loaded as a shared loader, use it as a module instead
export function postModuleMessage({id, message}: {id: number, message: MessageToSharedWorker}, fn: (message: Object) => void) {
  handleMessage({id, message}, {postMessage: fn});
}

