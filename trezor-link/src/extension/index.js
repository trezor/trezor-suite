/* @flow */

'use strict';

import * as messages from './messages';
import type {AcquireInput, TrezorDeviceInfoWithSession, MessageFromTrezor} from '../transport';
import * as check from '../highlevel-checks';

import {debugInOut} from '../debug-decorator';

const EXTENSION_ID: string = `jcjjhjgimijdkoamemaghajlhegmoclj`;

function maybeParseInt(input: ?string): ?(string | number) {
  if (input == null) {
    return null;
  }
  if (isNaN(input)) {
    return input;
  } else {
    const parsed = parseInt(input);
    if (isNaN(parsed)) {
      return input;
    }
    return parsed;
  }
}

export default class ChromeExtensionTransport {
  name: string = `ChromeExtensionTransport`;
  version: string = ``;
  configured: boolean = false;

  id: string;
  showUdevError: boolean = false;

  debug: boolean = false;

  constructor(id?: ?string) {
    this.id = id == null ? EXTENSION_ID : id;
  }

  async _send(message: messages.ChromeMessage): Promise<mixed> {
    const res = await messages.send(this.id, message);
    const udev = await messages.send(this.id, {type: `udevStatus`});
    this.showUdevError = (udev === `display`);
    return res;
  }

  async ping(): Promise<void> {
    const res = await this._send({type: `ping`});
    if (res !== `pong`) {
      throw new Error(`Response to "ping" should be "pong".`);
    }
  }

  async info(): Promise<{version: string, configured: boolean}> {
    const infoS = await this._send({type: `info`});
    return check.info(infoS);
  }

  @debugInOut
  async init(debug: ?boolean): Promise<void> {
    this.debug = !!debug;
    await this._silentInit();
  }

  async _silentInit(): Promise<void> {
    await messages.exists();
    await this.ping();
    const info = await this.info();
    this.version = info.version;
    this.configured = info.configured;
  }

  @debugInOut
  async configure(config: string): Promise<void> {
    await this._send({
      type: `configure`,
      body: config,
    });
    // we should reload configured after configure
    await this._silentInit();
  }

  @debugInOut
  async listen(old: ?Array<TrezorDeviceInfoWithSession>): Promise<Array<TrezorDeviceInfoWithSession>> {
    const devicesS: mixed = await (
      this._send({
        type: `listen`,
        body: old == null ? null : old.map(device => {
          // hack for old extension
          const session = maybeParseInt(device.session);
          const path = maybeParseInt(device.path);
          let res = {
            path,
            // hack for old extension
            product: 1,
            vendor: 21324,
            serialNumber: 0,
          };
          // hack for old extension
          if (session != null) {
            res = { session, ...res };
          }
          return res;
        }),
      })
    );
    const devices = check.devices(devicesS);
    return devices;
  }

  @debugInOut
  async enumerate(): Promise<Array<TrezorDeviceInfoWithSession>> {
    const devicesS: mixed = await this._send({type: `enumerate`});
    const devices = check.devices(devicesS);
    return devices;
  }

  async _acquireMixed(input: AcquireInput): Promise<mixed> {
    const checkPrevious = input.checkPrevious;
    if (checkPrevious) {
      return this._send({
        type: `acquire`,
        body: {
          path: maybeParseInt(input.path),
          previous: maybeParseInt(input.previous),
        },
      });
    } else {
      return this._send({
        type: `acquire`,
        body: maybeParseInt(input.path),
      });
    }
  }

  @debugInOut
  async acquire(input: AcquireInput): Promise<string> {
    const acquireS = await this._acquireMixed(input);
    return check.acquire(acquireS);
  }

  @debugInOut
  async release(session: string): Promise<void> {
    await this._send({
      type: `release`,
      body: maybeParseInt(session),
    });
  }

  @debugInOut
  async call(session: string, name: string, data: Object): Promise<MessageFromTrezor> {
    const res = await this._send({
      type: `call`,
      body: {
        id: maybeParseInt(session),
        type: name,
        message: data,
      },
    });
    return check.call(res);
  }

  requestDevice(): Promise<void> {
    return Promise.reject();
  }

  requestNeeded: boolean = false;
}
