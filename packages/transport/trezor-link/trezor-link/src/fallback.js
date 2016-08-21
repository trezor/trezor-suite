/* @flow */

import type {Transport, AcquireInput, TrezorDeviceInfoWithSession, MessageFromTrezor} from './transport';

import {debugInOut} from './debug-decorator';

export default class FallbackTransport {

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
  async _tryTransports(): Promise<Transport> {
    let lastError: ?Error = null;
    // eslint-disable-next-line prefer-const
    for (let transport of this.transports) {
      try {
        await transport.init(this.debug);
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
    const transport = await this._tryTransports();
    this.activeTransport = transport;
    this.version = this.activeTransport.version;
    this.configured = this.activeTransport.configured;
  }

  // using async so I get Promise.recect on this.activeTransport == null (or other error), not Error
  async enumerate(): Promise<Array<TrezorDeviceInfoWithSession>> {
    return this.activeTransport.enumerate();
  }

  async listen(old: ?Array<TrezorDeviceInfoWithSession>): Promise<Array<TrezorDeviceInfoWithSession>> {
    return this.activeTransport.listen(old);
  }

  async acquire(input: AcquireInput): Promise<string> {
    return this.activeTransport.acquire(input);
  }

  async release(session: string): Promise<void> {
    return this.activeTransport.release(session);
  }

  async configure(signedData: string): Promise<void> {
    await this.activeTransport.configure(signedData);
    this.configured = this.activeTransport.configured;
  }

  async call(session: string, name: string, data: Object): Promise<MessageFromTrezor> {
    return this.activeTransport.call(session, name, data);
  }

}
