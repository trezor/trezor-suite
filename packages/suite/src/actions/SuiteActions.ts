import { Device } from 'trezor-connect';
import * as SUITE from './constants/suite';
import { Dispatch, GetState, TrezorDevice } from '@suite/types';

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
    } | {
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
export const selectDevice = (device: Device) => (dispatch: Dispatch, getState: GetState) => {
    // 1. check if ui is not blocked

    // 2. check if device is acquired

    // 3. check if device is in available mode

    // 4. 
    const payload = getState().devices.find(d => device.path === d.path);
    dispatch({
        type: SUITE.SELECT_DEVICE,
        payload
    })

};

export const selectFirstAvailableDevice = () => () => {

}

// export const handleDeviceEvent = (device: Device) => (dispatch: Dispatch, getState: GetState) => {
export const handleDeviceConnect = (device: Device) => (dispatch: Dispatch) => {
    // const selected = getState().suite;
    // if (!selected) {
    //     dispatch(selectFirstAvailableDevice());
    // }
    // if (selected && selected.path === device.path) {
    //     // TODO: event affects selected device
    // }

    dispatch(selectDevice(device));

}

export const handleDeviceDisconnect = (device: Device) => (dispatch: Dispatch, getState: GetState) => {
    const selected = getState().suite.device;
    if (!selected) {
        //TODO: strange error , it should be
        return;
    }

    if (selected.path === device.path) {
        // selected device gets disconnected, decide what to do next (forget?)
        dispatch({
            type: SUITE.SELECT_DEVICE,
            payload: undefined
        })
    } else {
        // other device
    }

}


