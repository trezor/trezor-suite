declare class Chrome {
  hid: ChromeHid;
  runtime: ChromeRuntime;
  storage: ChromeStorage;
  app: ChromeApp;
  browser: ChromeBrowser;
  sockets: ChromeSockets;
}

declare class ChromeSockets {
  udp: ChromeUdp;
}

declare type ChromeUdpProperties = {
  persistent?: boolean;
  name?: string;
  bufferSize?: number;
}

declare type ChromeUdpCreateInfo = {
  socketId: number;
}

declare type ChromeUdpSendInfo = {
  resultCode: number;
  bytesSent?: number;
}

declare class ChromeOnReceive {
  addListener: (callback: (info: ChromeUdpReceiveInfo) => void) => void;
}

declare type ChromeUdpReceiveInfo = {
  socketId: number;
  data: ArrayBuffer;
  remoteAddress: string;
  remotePort: number;
}

declare class ChromeUdp {
  create: (properties: ChromeUdpProperties, callback: (info: ChromeUdpCreateInfo) => void) => void;
  close: (socketId: number, callback: () => void) => void;
  bind: (socketId: number, address: string, port: number, callback: (result: number) => void) => void;
  send: (socketId: number, data: ArrayBuffer, address: string, port: number,
    callback: (info: ChromeUdpSendInfo) => void
  ) => void;
  onReceive: ChromeOnReceive;
}

declare class ChromeHidDeviceInfo {
  deviceId: number;
  vendorId: number;
  productId: number;
  collections: Array<{usagePage: number, usage: number, reportIds:Array<number>}>;
  maxInputReportSize: number;
  maxOutputReportSize: number;
  maxFeatureReportSize: number;
  reportDescriptor: ArrayBuffer;
}

declare type ChromeHidGetDevicesOptions = {
  vendorId? : number;
  productId? : number;
  filters?: Array<{
    vendorId? : number;
    productId? : number;
    usagePage? : number;
    usage? : number;
  }>
}

declare class ChromeHid {
  getDevices: (options: ChromeHidGetDevicesOptions,
              callback: (i: Array<ChromeHidDeviceInfo>) => void) => void;

  send: (connectionId: number, reportId: number, data: ArrayBuffer, callback: () => void) => void;
  
  receive: (connectionId: number, callback: (reportId: number, data: ArrayBuffer) => void) => void;

  connect: (deviceId: number, callback: (connection: {connectionId: number}) => void) => void;

  disconnect: (connectionId: number, callback: () => void) => void;
}

declare class ChromePlatformInfo {
  os: string;
  arch: string;
  nacl_arch: string;
}

declare class ChromeRuntime {
  lastError: string;
  getPlatformInfo(callback: (platformInfo: ChromePlatformInfo) => void): void,
  onMessageExternal: ChromeOnMessage;
  onMessage: ChromeOnMessage;
  getManifest(): Object;
  id: string;

  sendMessage(
        message: any,
        options?: {includeTlsChannelId?: boolean},
        callback?: (response?: any) => void
    ): void;
    sendMessage(
        extensionId: string,
        message: any,
        options?: {includeTlsChannelId?: boolean},
        callback?: (response?: any) => void
    ): void;

}

declare type ChromeStorageItems = { [key:string]: any}
declare type ChromeCallback = () => void;

declare class ChromeStorageArea {
  getBytesInUse(callback: (bytesInUse: number) => void): void;
  getBytesInUse(keys: string, callback: (bytesInUse: number) => void): void;
  getBytesInUse(keys: string[], callback: (bytesInUse: number) => void): void;
  clear(callback?: ChromeCallback): void;
  set(items: ChromeStorageItems, callback?: ChromeCallback): void;
  remove(keys: string, callback?: ChromeCallback): void;
  remove(keys: string[], callback?: ChromeCallback): void;
  get(callback: (items: ChromeStorageItems) => void): void;
  get(keys: string, callback: (items: ChromeStorageItems) => void): void;
  get(keys: string[], callback: (items: ChromeStorageItems) => void): void;

  QUOTA_BYTES: number
}

declare class ChromeStorage {
  local: ChromeStorageArea;
}

declare class ChromeMessageSender {
  tabs: ?any;
  frameId: ?number;
  id: ?string;
  url: ?string;
  tlsChanelId: ?string;
}

declare class ChromeOnMessage {
  addListener: (
    callback: (
      message: Object, sender:ChromeMessageSender, sendResponse: (
        response: Object
      ) => void
    ) => boolean
  ) => void;
}

declare class ChromeApp {
  runtime: ChromeAppRuntime;   
  window: ChromeAppWindow;
}

declare class ChromeAppRuntime {
  onLaunched: ChromeAppOnLaunched;        
}

declare class ChromeAppOnLaunched {
  addListener: (
    callback: () => void //callback can have more parameters but I am not using them
  ) => void;
}

declare class ChromeBrowser {
  // according to specification, callback is optional, but in reality it's mandatory (as of now)
  openTab: (options: {url: string}, callback: () => void) => void
}

declare type ChromeBoundsSpecification = {
  left? : number,
  top? : number,
  width? : number,
  height? : number,
  minWidth?: number,
  minHeight?: number,
  maxWidth?: number,
  maxHeight?: number
}

declare class ChromeAppWindowOnClosed {
  addListener: ( callback: () => void ) => void
}

declare class ChromeAppWindow {
  create: (url: string, options: {innerBounds: ChromeBoundsSpecification}, callback: (createdWindow: ChromeAppWindow) => void) => void;
  onClosed: ChromeAppWindowOnClosed;
}

declare var chrome: Chrome;
