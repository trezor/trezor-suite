import { type OnConnectEvent } from './ReactNativeUsb.types';

// We don't support USB on iOS :(
export class WebUSB {
    public getDevices = () => [];

    set onconnect(_listener: (event: OnConnectEvent) => void) {
        // do nothing
    }
    set ondisconnect(_listener: (event: OnConnectEvent) => void) {
        // do nothing
    }

    requestDevice = (..._params: unknown[]): Promise<never> =>
        Promise.reject(
            new Error('requestDevice is not implemented in @trezor/react-native-usb (iOS)'),
        );
    addEventListener = (..._params: unknown[]): void => {};
    removeEventListener = (..._params: unknown[]): void => {};
    dispatchEvent = (..._params: unknown[]): boolean => false;
}
