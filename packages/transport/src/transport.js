/* @flow */

// does not have session
export type TrezorDeviceInfo = {
  path: string;
}

export type TrezorDeviceInfoWithSession = TrezorDeviceInfo & {
  session: ?string;
  debugSession: ?string;
  debug: boolean;
}

export type AcquireInput = {
  path: string;
  previous: ?string;
}

export type MessageFromTrezor = {type: string, message: Object};

export type Transport = {
  enumerate(): Promise<Array<TrezorDeviceInfoWithSession>>;
  listen(old: ?Array<TrezorDeviceInfoWithSession>): Promise<Array<TrezorDeviceInfoWithSession>>;
  acquire(input: AcquireInput, debugLink: boolean): Promise<string>;
  release(session: string, onclose: boolean, debugLink: boolean): Promise<void>;
  configure(signedData: JSON | string): Promise<void>;
  call(session: string, name: string, data: Object, debugLink: boolean): Promise<MessageFromTrezor>;
  post(session: string, name: string, data: Object, debugLink: boolean): Promise<void>;
  read(session: string, debugLink: boolean): Promise<MessageFromTrezor>;

  // resolves when the transport can be used; rejects when it cannot
  init(debug: ?boolean): Promise<void>;
  stop(): void;

  configured: boolean;
  version: string;
  name: string;
  +activeName?: string;

  // webusb has a different model, where you have to
  // request device connection
  +requestDevice: () => Promise<void>;
  requestNeeded: boolean;

  isOutdated: boolean;
  setBridgeLatestUrl(url: string): void;
  setBridgeLatestVersion(version: string): void;
}
