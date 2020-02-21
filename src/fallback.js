/* @flow */

import type {Transport, AcquireInput, TrezorDeviceInfoWithSession, MessageFromTrezor} from './transport';

import {debugInOut} from './debug-decorator';

export default class FallbackTransport {
  name: string = `FallbackTransport`;
  activeName: string = ``;

  _availableTransports: Array<Transport>;
  transports: Array<Transport>;
  configured: boolean;
  version: string;
  debug: boolean = false;

  // note: activeTransport is actually "?Transport", but
  // everywhere I am using it is in `async`, so error gets returned as Promise.reject
  activeTransport: Transport;

  constructor(transports: Array<Transport>) {
    this.transports = transports;
  }

  // first one that inits successfuly is the final one; others won't even start initing
  async _tryInitTransports(): Promise<Array<Transport>> {
    const res: Array<Transport> = [];
    let lastError: ?Error = null;
    for (const transport of this.transports) {
      try {
        await transport.init(this.debug);
        res.push(transport);
      } catch (e) {
        lastError = e;
      }
    }
    if (res.length === 0) {
      throw lastError || new Error(`No transport could be initialized.`);
    }
    return res;
  }

  // first one that inits successfuly is the final one; others won't even start initing
  async _tryConfigureTransports(data: JSON | string): Promise<Transport> {
    let lastError: ?Error = null;
    for (const transport of this._availableTransports) {
      try {
        await transport.configure(data);
        return transport;
      } catch (e) {
        lastError = e;
      }
    }
    throw lastError || new Error(`No transport could be initialized.`);
  }

  @debugInOut
  async init(debug: ?boolean): Promise<void> {
    this.debug = !!debug;

    // init ALL OF THEM
    const transports = await this._tryInitTransports();
    this._availableTransports = transports;

    // a slight hack - configured is always false, so we force caller to call configure()
    // to find out the actual working transport (bridge falls on configure, not on info)
    this.version = transports[0].version;
    this.configured = false;
  }

  isOutdated: boolean;
  async configure(signedData: JSON | string): Promise<void> {
    const pt: Promise<Transport> = this._tryConfigureTransports(signedData);
    this.activeTransport = await pt;
    this.configured = this.activeTransport.configured;
    this.version = this.activeTransport.version;
    this.activeName = this.activeTransport.name;
    this.requestNeeded = this.activeTransport.requestNeeded;
    this.isOutdated = this.activeTransport.isOutdated;
  }

  // using async so I get Promise.recect on this.activeTransport == null (or other error), not Error
  async enumerate(): Promise<Array<TrezorDeviceInfoWithSession>> {
    return this.activeTransport.enumerate();
  }

  async listen(old: ?Array<TrezorDeviceInfoWithSession>): Promise<Array<TrezorDeviceInfoWithSession>> {
    return this.activeTransport.listen(old);
  }

  async acquire(input: AcquireInput, debugLink: boolean): Promise<string> {
    return this.activeTransport.acquire(input, debugLink);
  }

  async release(session: string, onclose: boolean, debugLink: boolean): Promise<void> {
    return this.activeTransport.release(session, onclose, debugLink);
  }

  async call(session: string, name: string, data: Object, debugLink: boolean): Promise<MessageFromTrezor> {
    return this.activeTransport.call(session, name, data, debugLink);
  }

  async post(session: string, name: string, data: Object, debugLink: boolean): Promise<void> {
    return this.activeTransport.post(session, name, data, debugLink);
  }

  async read(session: string, debugLink: boolean): Promise<MessageFromTrezor> {
    return this.activeTransport.read(session, debugLink);
  }

  async requestDevice(): Promise<void> {
    return this.activeTransport.requestDevice();
  }

  requestNeeded: boolean = false;

  setBridgeLatestUrl(url: string): void {
    for (const transport of this.transports) {
      transport.setBridgeLatestUrl(url);
    }
  }

  setBridgeLatestVersion(version: string): void {
    for (const transport of this.transports) {
      transport.setBridgeLatestVersion(version);
    }
  }

  stop(): void {
    for (const transport of this.transports) {
      transport.stop();
    }
  }
}
