import { NativeModules, Platform } from 'react-native';

const LINKING_ERROR =
    `The package '@trezor/transport-native' doesn't seem to be linked. Make sure: \n\n${Platform.select(
        { ios: "- You have run 'pod install'\n", default: '' },
    )}- You rebuilt the app after installing the package\n` +
    `- You are not using Expo managed workflow\n`;

console.log(NativeModules);

const TrezorTransport = NativeModules.TrezorTransport
    ? NativeModules.TrezorTransport
    : new Proxy(
          {},
          {
              get() {
                  throw new Error(LINKING_ERROR);
              },
          },
      );

type DevicePath = string;
type Data = string;
interface TrezorDeviceInfoDebug {
    path: DevicePath;
    debug: boolean;
}

export const enumerate = (): Promise<TrezorDeviceInfoDebug[]> => TrezorTransport.enumerate();

export const acquire = (path: DevicePath, debugLink: boolean): Promise<void> =>
    TrezorTransport.acquire(path, debugLink);

export const release = (path: DevicePath, debugLink: boolean, closePort: boolean): Promise<void> =>
    TrezorTransport.release(path, debugLink, closePort);

export const write = (path: DevicePath, debugLink: boolean, data: Data): Promise<void> =>
    TrezorTransport.write(path, debugLink, data);

export const read = (path: DevicePath, debugLink: boolean): Promise<{ data: Data }> =>
    TrezorTransport.read(path, debugLink);
