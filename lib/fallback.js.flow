/* @flow */

import type {Transport, AcquireInput, TrezorDeviceInfoWithSession, MessageFromTrezor} from './transport';

export class FallbackTransport {

  transports: Array<{name: string, transport: Transport}>;
  configured: boolean;
  version: string;

  // note: activeTransport is actually "?Transport", but
  // everywhere I am using it is in `async`, so error gets returned as Promise.reject
  activeTransport: Transport;

  constructor(transports: Array<{name: string, transport: Transport}>) {
    this.transports = transports;
  }

  // first one that inits successfuly is the final one; others won't even start initing
  async _tryTransports(): Promise<Transport> {
    let lastError: ?Error = null;
    // eslint-disable-next-line prefer-const
    for (let transportObj of this.transports) {
      const transport = transportObj.transport;
      try {
        await transport.init();
        return transport;
      } catch (e) {
        lastError = e;
        // ...
      }
    }
    throw lastError || new Error(`No transport could be initialized.`);
  }

  async init(): Promise<void> {
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
