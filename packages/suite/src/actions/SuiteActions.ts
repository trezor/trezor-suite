import { Device } from 'trezor-connect';
import { Dispatch, GetState, TrezorDevice } from '@suite/types';
import * as routerUtils from '@suite/utils/router';
import * as SUITE from './constants/suite';
import * as routerActions from './routerActions';

export type SuiteActions =
    | {
          type: typeof SUITE.INIT;
      }
    | {
          type: typeof SUITE.READY;
      }
    | {
          type: typeof SUITE.CONNECT_INITIALIZED;
      }
    | {
          type: typeof SUITE.ERROR;
          error: any;
      }
    | {
          type: typeof SUITE.SELECT_DEVICE;
          payload?: TrezorDevice;
      };

export const onSuiteReady = (): SuiteActions => {
    return {
        type: SUITE.READY,
    };
};

export const onSuiteError = (error: any): SuiteActions => {
    return {
        type: SUITE.ERROR,
        error,
    };
};

// Called from "DEVICE.CONNECT/DEVICE.DISCONNECT" events or from UI
export const selectDevice = (device: Device | TrezorDevice | undefined) => (
    dispatch: Dispatch,
    getState: GetState,
) => {
    // 1. TODO: check if ui is not blocked (by device request, or application itself - for example onboarding)

    // 2. TODO: check if device is acquired

    // 3. TODO: check if device is in available mode (oinitialized, readable)

    // 4. select this device
    const payload = device ? getState().devices.find(d => device.path === d.path) : device;
    dispatch({
        type: SUITE.SELECT_DEVICE,
        payload,
    });

    // redirect to wallet homepage
    // if (!routerUtils.isWallet(getState().router.url)) {
    //     routerActions.goto('/')
    // }
};

export const selectFirstAvailableDevice = () => () => {};

// export const handleDeviceEvent = (device: Device) => (dispatch: Dispatch, getState: GetState) => {
export const handleDeviceConnect = (device: Device) => (dispatch: Dispatch, getState: GetState) => {
    const selected = getState().suite.device;
    if (!selected) {
        dispatch(selectDevice(device));
    }
};

export const handleDeviceDisconnect = (device: Device) => (
    dispatch: Dispatch,
    getState: GetState,
) => {
    const selected = getState().suite.device;
    if (!selected) {
        // TODO: strange error , it should be
        return;
    }

    if (selected.path === device.path) {
        // selected device gets disconnected, decide what to do next (forget?)
        dispatch({
            type: SUITE.SELECT_DEVICE,
            payload: undefined,
        });
    } else {
        // other device
    }
};
