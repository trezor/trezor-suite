import {
  NativeModulesProxy,
  EventEmitter,
  Subscription,
} from "expo-modules-core";

// Import the native module. On web, it will be resolved to ReactNativeUsb.web.ts
// and on native platforms to ReactNativeUsb.ts
import ReactNativeUsbModule from "./ReactNativeUsbModule";
import {
  NativeDevice,
  OnConnectEventPayload,
  OnDeviceDisconnectEventPayload,
  WebUSBDevice,
} from "./ReactNativeUsb.types";

const emitter = new EventEmitter(
  ReactNativeUsbModule ?? NativeModulesProxy.ReactNativeUsb
);

const open = (deviceName: string) => ReactNativeUsbModule.open(deviceName);

const close = (deviceName: string) => ReactNativeUsbModule.close(deviceName);

const claimInterface = (deviceName: string, interfaceNumber: number) =>
  ReactNativeUsbModule.claimInterface(deviceName, interfaceNumber);

const releaseInterface = (deviceName: string, interfaceNumber: number) =>
  ReactNativeUsbModule.releaseInterface(deviceName, interfaceNumber);

const selectConfiguration = (deviceName: string, configurationValue: number) =>
  ReactNativeUsbModule.selectConfiguration(deviceName, configurationValue);

const transferIn = async (
  deviceName: string,
  endpointNumber: number,
  length: number
) => {
  const result = await ReactNativeUsbModule.transferIn(
    deviceName,
    endpointNumber,
    length
  )
    .catch((error) => {
      console.log("JS: USB read error: ", error);
      throw error;
    })
    .then((result) => {
      console.log(
        "JS: Native USB read result:",
        String(result),
        typeof result,
        JSON.stringify(result)
      );
      return {
        data: new Uint8Array(result),
        status: "ok",
      };
    });

  return result;
};

const transferOut = async (
  deviceName: string,
  endpointNumber: number,
  data: Uint8Array | BufferSource
) => {
  try {
    await ReactNativeUsbModule.transferOut(
      deviceName,
      endpointNumber,
      data.toString()
    );
    return { status: "ok" };
  } catch (error) {
    console.log("JS: USB write error", error);
    throw error;
  }
};

export function onDeviceConnected(
  listener: (event: OnConnectEventPayload) => void
): Subscription {
  return emitter.addListener<OnConnectEventPayload>(
    "onDeviceConnect",
    (event) => {
      const eventPayload = {
        device: createWebUSBDevice(event as any),
      };
      console.log("JS: USB onDeviceConnect", eventPayload);
      return listener(eventPayload as any);
    }
  );
}

export function onDeviceDisconnect(
  listener: (event: OnDeviceDisconnectEventPayload) => void
): Subscription {
  return emitter.addListener<OnDeviceDisconnectEventPayload>(
    "onDeviceDisconnect",
    (event) => {
      const eventPayload = {
        device: createWebUSBDevice(event as any),
      };
      console.log("JS: USB onDeviceDisconnect", eventPayload);
      return listener(eventPayload as any);
    }
  );
}

export async function getDevices(): Promise<any> {
  const devices = await ReactNativeUsbModule.getDevices();
  return devices.map((device: NativeDevice) => createWebUSBDevice(device));
}

const createNoop = (methodName: string) => async () => {
  console.log(`Calling ${methodName} which is not implemented.`);
  return;
};

const createWebUSBDevice = (device: NativeDevice): WebUSBDevice => ({
  ...device,
  open: () => open(device.deviceName),
  close: () => close(device.deviceName),
  forget: createNoop("forget"),
  selectConfiguration: (configurationValue: number) =>
    selectConfiguration(device.deviceName, configurationValue),
  claimInterface: (interfaceNumber: number) =>
    claimInterface(device.deviceName, interfaceNumber),
  releaseInterface: (interfaceNumber: number) =>
    releaseInterface(device.deviceName, interfaceNumber),
  selectAlternateInterface: createNoop("selectAlternateInterface"),
  controlTransferIn: createNoop("controlTransferIn"),
  controlTransferOut: createNoop("controlTransferOut"),
  clearHalt: createNoop("clearHalt"),
  transferIn: (endpointNumber: number, length: number) =>
    transferIn(device.deviceName, endpointNumber, length),
  transferOut: (endpointNumber: number, data: BufferSource) =>
    transferOut(device.deviceName, endpointNumber, data),
  isochronousTransferIn: createNoop("isochronousTransferIn"),
  isochronousTransferOut: createNoop("isochronousTransferOut"),
  reset: createNoop("reset"),

  // TODO: Implement these properties
  usbVersionMajor: 2,
  usbVersionMinor: 0,
  usbVersionSubminor: 0,
  deviceVersionMajor: 1,
  deviceVersionMinor: 0,
  deviceVersionSubminor: 0,
  configurations: [],
});

export class WebUSB {
  public getDevices = getDevices;

  set onconnect(listener: (event: OnConnectEventPayload) => void) {
    onDeviceConnected(listener);
  }
  set ondisconnect(listener: (event: OnDeviceDisconnectEventPayload) => void) {
    onDeviceDisconnect(listener);
  }
}
