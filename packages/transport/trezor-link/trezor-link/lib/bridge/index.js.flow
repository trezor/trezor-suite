/* @flow */

'use strict';

import semvercmp from 'semver-compare';
import http from './http';
import type {AcquireInput, TrezorDeviceInfoWithSession, MessageFromTrezor} from '../transport';
import * as check from '../highlevel-checks';

const DEFAULT_URL = `https://localback.net:21324`;
const DEFAULT_VERSION_URL = `https://wallet.mytrezor.com/data/bridge/latest.txt`;

type IncompleteRequestOptions = {
  body?: ?(Array<any> | Object | string);
  url: string;
};

export default class BridgeTransport {
  version: string = ``;
  configured: boolean = false;
  isOutdated: boolean;

  url: string;
  newestVersionUrl: string;

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

  async init(): Promise<void> {
    const infoS: mixed = await http({
      url: this.url,
      method: `GET`,
    });
    const info = check.info(infoS);
    this.version = info.version;
    this.configured = info.configured;
    const newVersion = check.version(await http({
      url: this.newestVersionUrl,
      method: `GET`,
    }));
    this.isOutdated = semvercmp(this.version, newVersion) < 0;
  }

  async configure(config: string): Promise<void> {
    await this._post({
      url: `/configure`,
      body: config,
    });
    // we should reload configured after configure
    await this.init();
  }

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

  async acquire(input: AcquireInput): Promise<string> {
    const acquireS = await this._acquireMixed(input);
    return check.acquire(acquireS);
  }

  async release(session: string): Promise<void> {
    await this._post({url: `/release/` + session});
  }

  async call(session: string, name: string, data: Object): Promise<MessageFromTrezor> {
    const res = await this._post({
      url: `/call/` + session,
      body: {
        type: name,
        message: data,
      },
    });
    return check.call(res);
  }
}
