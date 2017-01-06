/* @flow */

// does not have session
export type TrezorDeviceInfo = {
  path: string;
}

export type TrezorDeviceInfoWithSession = TrezorDeviceInfo & {
  session: ?string;
}

export type AcquireInput = {
  path: string;
  previous: ?string;
  checkPrevious: boolean;
}

export type MessageFromTrezor = {type: string, message: Object};

export type Transport = {
  enumerate(): Promise<Array<TrezorDeviceInfoWithSession>>;
  listen(old: ?Array<TrezorDeviceInfoWithSession>): Promise<Array<TrezorDeviceInfoWithSession>>;
  acquire(input: AcquireInput): Promise<string>;
  release(session: string): Promise<void>;
  configure(signedData: string): Promise<void>;
  call(session: string, name: string, data: Object): Promise<MessageFromTrezor>;

  // resolves when the transport can be used; rejects when it cannot
  init(debug: ?boolean): Promise<void>;

  configured: boolean;
  version: string;
  name: string;

  // webusb has a different model, where you have to
  // request device connection
  +requestDevice: () => Promise<void>;
  requestNeeded: boolean;
}
