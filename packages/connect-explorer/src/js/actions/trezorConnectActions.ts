import { DEVICE } from 'trezor-connect';

import { TrezorConnectDevice } from '../types';
import * as ACTIONS from './index';

export type TrezorConnectAction =
    | { type: typeof ACTIONS.ON_SELECT_DEVICE; path: string }
    | { type: typeof DEVICE.CONNECT; device: TrezorConnectDevice }
    | { type: typeof DEVICE.CONNECT_UNACQUIRED; device: TrezorConnectDevice }
    | { type: typeof DEVICE.DISCONNECT; device: TrezorConnectDevice };

export function onSelectDevice(path: string) {
    return {
        type: ACTIONS.ON_SELECT_DEVICE,
        path,
    };
}
