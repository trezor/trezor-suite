/* @flow */

// bridge is now half-way between lowlevel and not
// however, it is not doing actual sending in/to the devices
// and it refers enumerate to bridge

'use strict';

import semvercmp from 'semver-compare';
import {request as http, setFetch as rSetFetch} from './http';
import type {AcquireInput, TrezorDeviceInfoWithSession, MessageFromTrezor} from '../transport';
import * as check from '../highlevel-checks';

import {buildOne} from '../lowlevel/send';
import type {Messages} from '../lowlevel/protobuf/messages';
import {parseConfigure} from '../lowlevel/protobuf/parse_protocol';
import {verifyHexBin} from '../lowlevel/verify';
import {receiveOne} from '../lowlevel/receive';

import {debugInOut} from '../debug-decorator';

const DEFAULT_URL = `https://localback.net:21324`;
const DEFAULT_VERSION_URL = `https://wallet.trezor.io/data/bridge/latest.txt`;

type IncompleteRequestOptions = {
  body?: ?(Array<any> | Object | string);
  url: string;
};

export default class BridgeTransport {
  name: string = `BridgeTransport`;
  version: string = ``;
  configured: boolean = false;
  isOutdated: boolean;
  isDirect: boolean;

  url: string;
  newestVersionUrl: string;
  debug: boolean = false;

  _messages: ?Messages;

  constructor(url?: ?string, newestVersionUrl?: ?string) {
    this.url = url == null ? DEFAULT_URL : url;
    this.newestVersionUrl = newestVersionUrl == null ? DEFAULT_VERSION_URL : newestVersionUrl;
  }

  async _post(options: IncompleteRequestOptions): Promise<mixed> {
    return await http({ ...options, method: `POST`, url: this.url + options.url });
  }

  async _get(options: IncompleteRequestOptions): Promise<mixed> {
    return await http({ ...options, method: `GET`, url: this.url + options.url });
  }

  @debugInOut
  async init(debug: ?boolean): Promise<void> {
    this.debug = !!debug;
    await this._silentInit();
  }

  async _silentInit(): Promise<void> {
    const infoS: mixed = await http({
      url: this.url,
      method: `GET`,
    });
    const info = check.info(infoS);
    this.version = info.version;
    this.configured = info.configured;
    const newVersion = check.version(await http({
      url: `${this.newestVersionUrl}?${Date.now()}`,
      method: `GET`,
    }));
    this.isOutdated = semvercmp(this.version, newVersion) < 0;
    this.isDirect = semvercmp(this.version, `2.0.0`) >= 0;
  }

  @debugInOut
  async configure(config: string): Promise<void> {
    if (this.isDirect) {
      const buffer = verifyHexBin(config);
      const messages = parseConfigure(buffer);
      this._messages = messages;
      this.configured = true;
    }

    await this._post({
      url: `/configure`,
      body: config,
    });
    // we should reload configured after configure
    await this._silentInit();
  }

  @debugInOut
  async listen(old: ?Array<TrezorDeviceInfoWithSession>): Promise<Array<TrezorDeviceInfoWithSession>> {
    const devicesS: mixed = await (
      old == null
        ? this._get({url: `/listen`})
        : this._post({
          url: `/listen`,
          body: old.map(device => {
            return {
              ...device,
              // hack for old trezord
              product: 1,
              vendor: 21324,
            };
          }),
        })
    );
    const devices = check.devices(devicesS);
    return devices;
  }

  @debugInOut
  async enumerate(): Promise<Array<TrezorDeviceInfoWithSession>> {
    const devicesS: mixed = await this._get({url: `/enumerate`});
    const devices = check.devices(devicesS);
    return devices;
  }

  async _acquireMixed(input: AcquireInput): Promise<mixed> {
    const checkPrevious = input.checkPrevious && (semvercmp(this.version, `1.1.3`) >= 0);
    if (checkPrevious) {
      const previousStr = input.previous == null ? `null` : input.previous;
      const url = `/acquire/` + input.path + `/` + previousStr;
      return this._post({url: url});
    } else {
      return this._post({url: `/acquire/` + input.path});
    }
  }

  @debugInOut
  async acquire(input: AcquireInput): Promise<string> {
    const acquireS = await this._acquireMixed(input);
    return check.acquire(acquireS);
  }

  @debugInOut
  async release(session: string): Promise<void> {
    await this._post({url: `/release/` + session});
  }

  @debugInOut
  async call(session: string, name: string, data: Object): Promise<MessageFromTrezor> {
    if (this.isDirect) {
      if (this._messages == null) {
        throw new Error(`Transport not configured.`);
      }
      const messages = this._messages;
      const outData = buildOne(messages, name, data).toString(`hex`);
      const resData = await this._post({
        url: `/call/` + session,
        body: outData,
      });
      if (typeof resData !== `string`) {
        throw new Error(`Returning data is not string.`);
      }
      const jsonData = receiveOne(messages, new Buffer(resData, `hex`));
      return check.call(jsonData);
    }

    const res = await this._post({
      url: `/call/` + session,
      body: {
        type: name,
        message: data,
      },
    });
    return check.call(res);
  }

  static setFetch(fetch: any) {
    rSetFetch(fetch);
  }

  requestDevice(): Promise<void> {
    return Promise.reject();
  }

  requestNeeded: boolean = false;
}
