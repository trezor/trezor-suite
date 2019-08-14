import { Device, DEVICE } from 'trezor-connect';
import * as reducersUtils from '@suite-utils/reducers';
import { getRoute } from '@suite-utils/router';
import { goto } from '@suite-actions/routerActions';
import { SUITE } from './constants';
import { Action, Dispatch, GetState, TrezorDevice } from '@suite-types';

export type SuiteActions =
    | { type: typeof SUITE.INIT }
    | { type: typeof SUITE.READY }
    | { type: typeof SUITE.CONNECT_INITIALIZED }
    | { type: typeof SUITE.ERROR; error: any }
    | { type: typeof SUITE.SELECT_DEVICE; payload?: TrezorDevice }
    | { type: typeof SUITE.UPDATE_SELECTED_DEVICE; payload: TrezorDevice }
    | { type: typeof SUITE.SET_LANGUAGE; locale: string; messages: { [key: string]: string } }
    | { type: typeof SUITE.TOGGLE_DEVICE_MENU; opened: boolean }
    | { type: typeof SUITE.TOGGLE_SIDEBAR }
    | { type: typeof SUITE.ONLINE_STATUS; online: boolean };

export const updateOnlineStatus = () => (dispatch: Dispatch) => {
    const statusHandler = () => {
        dispatch({
            type: SUITE.ONLINE_STATUS,
            online: navigator.onLine,
        });
    };
    statusHandler();
    // TODO: not working in react-native
    if (typeof window !== 'undefined' && window.addEventListener) {
        window.addEventListener('online', statusHandler);
        window.addEventListener('offline', statusHandler);
    }
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
    const payload = device
        ? getState().devices.find((d: Device | TrezorDevice) => device.path === d.path)
        : device;
    dispatch({
        type: SUITE.SELECT_DEVICE,
        payload,
    });

    // redirect to wallet homepage
    // if (!routerUtils.isWallet(getState().router.url)) {
    //     routerActions.goto('/')
    // }
};

export const updateSelectedDevice = (device: TrezorDevice) => (dispatch: Dispatch) => {
    const payload = device;
    dispatch({
        type: SUITE.UPDATE_SELECTED_DEVICE,
        payload,
    });
};

export const selectFirstAvailableDevice = () => () => {};

// export const handleDeviceEvent = (device: Device) => (dispatch: Dispatch, getState: GetState) => {
export const handleDeviceConnect = (device: Device) => (dispatch: Dispatch, getState: GetState) => {
    const selected = getState().suite.device;
    const { app } = getState().router;
    if (!selected) {
        dispatch(selectDevice(device));
        if (device.type === 'acquired' && device.mode === 'initialize' && app !== 'onboarding') {
            goto(getRoute('onboarding-index'));
        }
    }
};

export const handleDeviceChanged = (device: any) => (dispatch: Dispatch, getState: GetState) => {
    const selected = getState().suite.device;
    if (selected) {
        dispatch(updateSelectedDevice(device));
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

export const toggleDeviceMenu = (opened: boolean) => ({
    type: SUITE.TOGGLE_DEVICE_MENU,
    opened,
});

export const toggleSidebar = () => ({
    type: SUITE.TOGGLE_SIDEBAR,
});

// list of all actions which has influence on "selectedDevice" field in "wallet" reducer
// other actions will be ignored
const actions: string[] = [
    // SUITE.AUTH_DEVICE,
    // SUITE.RECEIVE_WALLET_TYPE,
    ...Object.values(DEVICE).filter(v => typeof v === 'string'),
];

export const observeSelectedDevice = (action: Action) => (
    dispatch: Dispatch,
    getState: GetState,
) => {
    // ignore not listed actions
    if (actions.indexOf(action.type) < 0) return false;

    const { device } = getState().suite;
    if (!device) return false;
    const deviceFromReducer = reducersUtils.getSelectedDevice(device, getState().devices);
    if (!deviceFromReducer) {
        // this shouldn't happen
        return false;
    }

    const changed = reducersUtils.observeChanges(device, deviceFromReducer);
    if (changed) {
        dispatch({
            type: SUITE.UPDATE_SELECTED_DEVICE,
            payload: deviceFromReducer,
        });
    }

    return reducersUtils.observeChanges(device, deviceFromReducer);
};
