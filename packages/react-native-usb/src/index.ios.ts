import {
  OnConnectEventPayload,
  OnDeviceDisconnectEventPayload,
} from "./ReactNativeUsb.types";

// We don't support USB on iOS :(
export class WebUSB {
  public getDevices = () => [];

  set onconnect(listener: (event: OnConnectEventPayload) => void) {
    // do nothing
  }
  set ondisconnect(listener: (event: OnDeviceDisconnectEventPayload) => void) {
    // do nothing
  }
}
