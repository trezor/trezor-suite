import { OnConnectEvent } from './ReactNativeUsb.types';

// We don't support USB on iOS :(
export class WebUSB {
    public getDevices = () => [];

    set onconnect(_listener: (event: OnConnectEvent) => void) {
        // do nothing
    }
    set ondisconnect(_listener: (event: OnConnectEvent) => void) {
        // do nothing
    }

    requestDevice = async (..._params: any[]): Promise<any> => {};
    addEventListener = (..._params: any[]): any => {};
    removeEventListener = (..._params: any[]): any => {};
    dispatchEvent = (..._params: any[]): any => {};
}
