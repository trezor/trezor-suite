import TrezorConnect, { UI } from 'trezor-connect';
import * as ACTIONS from './index';

import { Dispatch } from '../types';

export interface TrezorConnectActions {
    type: typeof ACTIONS.ON_SELECT_DEVICE;
    path: string;
}

export function onSelectDevice(path: string): any {
    return {
        type: ACTIONS.ON_SELECT_DEVICE,
        path,
    };
}
