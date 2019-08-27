import TrezorConnect, { Device, DEVICE } from 'trezor-connect';
import * as reducersUtils from '@suite-utils/reducers';
import * as deviceUtils from '@suite-utils/device';
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
    | { type: typeof SUITE.REQUEST_PASSPHRASE_MODE; payload: TrezorDevice }
    | { type: typeof SUITE.RECEIVE_PASSPHRASE_MODE; payload: TrezorDevice; hidden: boolean }
    | { type: typeof SUITE.UPDATE_PASSPHRASE_MODE; payload: TrezorDevice; hidden: boolean }
    | { type: typeof SUITE.AUTH_DEVICE; payload: TrezorDevice; state: string }
    | { type: typeof SUITE.REQUEST_DEVICE_INSTANCE; payload: TrezorDevice }
    | { type: typeof SUITE.CREATE_DEVICE_INSTANCE; payload: TrezorDevice; name?: string }
    | { type: typeof SUITE.REQUEST_FORGET_DEVICE; payload: TrezorDevice }
    | { type: typeof SUITE.FORGET_DEVICE; payload: TrezorDevice }
    | { type: typeof SUITE.FORGET_DEVICE_INSTANCE; payload: TrezorDevice }
    | { type: typeof SUITE.REMEMBER_DEVICE; payload: TrezorDevice }
    | { type: typeof SUITE.SET_LANGUAGE; locale: string; messages: { [key: string]: string } }
    | { type: typeof SUITE.TOGGLE_DEVICE_MENU; opened: boolean }
    | { type: typeof SUITE.TOGGLE_SIDEBAR }
    | { type: typeof SUITE.ONLINE_STATUS; online: boolean }
    | { type: typeof SUITE.LOCK_UI; payload: boolean };

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

/**
 * Called from `trezor-connect` events handler: `handleDeviceConnect`, `handleDeviceDisconnect`
 * or from user action in: `@suite-components/DeviceMenu`
 * @param {(Device | TrezorDevice | undefined)} device
 */
export const selectDevice = (device: Device | TrezorDevice | undefined) => async (
    dispatch: Dispatch,
    getState: GetState,
) => {
    // 1. TODO: check if ui is not locked by device request or application itself (for example onboarding process)
    const { uiLocked, routerLocked } = getState().suite;
    if (uiLocked || routerLocked) return;
    // 2. TODO: check if device is acquired
    if (device && device.features) {
        const { app } = getState().router;
        // 3. device is not initialized, redirect to "onboarding"
        if (device.mode === 'initialize' && app !== 'onboarding') {
            await goto(getRoute('onboarding-index'));
        }
        // 4. device firmware update required, redirect to "firmware update"
        // if (device.firmware === 'required' && app !== 'suite-firmware-update') {
        //     goto(getRoute('suite-firmware-update'));
        // }
    }

    // 5. select this device
    const payload = device ? getState().devices.find(d => device.path === d.path) : device;
    dispatch({
        type: SUITE.SELECT_DEVICE,
        payload,
    });

    // eslint-disable-next-line @typescript-eslint/no-use-before-define
    dispatch(authorizeDevice());
};

export const selectFirstAvailableDevice = () => () => {};

/**
 * Triggered by `trezor-connect DEVICE_EVENT`
 * @param {Device} device
 */
export const handleDeviceConnect = (device: Device) => (dispatch: Dispatch, getState: GetState) => {
    const selected = getState().suite.device;
    if (!selected) {
        dispatch(selectDevice(device));
    } else {
        // TODO: show some nice notification/tooltip in DeviceMenu
    }
};

/**
 * Triggered by `trezor-connect DEVICE_EVENT`
 * @param {Device} device
 */
export const handleDeviceDisconnect = (device: Device) => (
    dispatch: Dispatch,
    getState: GetState,
) => {
    const selected = getState().suite.device;
    if (!selected) {
        // TODO: strange error , it shouldn't never happened
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

/**
 * list of actions which has influence on `device` field in `suite` reducer
 * all other actions should be ignored
 */
const actions: string[] = [
    SUITE.AUTH_DEVICE,
    SUITE.RECEIVE_PASSPHRASE_MODE,
    ...Object.values(DEVICE).filter(v => typeof v === 'string'),
];

/**
 * Called from `suiteMiddleware`
 * Keep `suite` reducer synchronized with `devices` reducer
 * @param {Action} action
 */
export const observeSelectedDevice = (action: Action) => (
    dispatch: Dispatch,
    getState: GetState,
) => {
    // ignore not listed actions
    if (actions.indexOf(action.type) < 0) return false;

    const selected = getState().suite.device;
    if (!selected) return false;
    const deviceFromReducer = deviceUtils.getSelectedDevice(selected, getState().devices);
    if (!deviceFromReducer) {
        // this shouldn't happen
        return false;
    }

    const changed = reducersUtils.observeChanges(selected, deviceFromReducer);
    if (changed) {
        dispatch({
            type: SUITE.UPDATE_SELECTED_DEVICE,
            payload: deviceFromReducer,
        });
    }

    return changed;
};

export const lockUI = (payload: boolean) => (dispatch: Dispatch) => {
    dispatch({
        type: SUITE.LOCK_UI,
        payload,
    });
};

export const acquireDevice = () => async (dispatch: Dispatch, getState: GetState) => {
    const { device } = getState().suite;
    if (!device) return;

    dispatch(lockUI(true));
    await TrezorConnect.getDeviceState({
        device: {
            path: device.path,
            instance: device.instance,
            state: device.state,
        },
        // useEmptyPassphrase: device.useEmptyPassphrase,
        useEmptyPassphrase: false,
    });
    dispatch(lockUI(false));
};

export const requestDeviceType = () => async (dispatch: Dispatch, getState: GetState) => {
    const { device } = getState().suite;
    if (!device) return;
    const isDeviceReady =
        device.connected &&
        device.features &&
        !device.state &&
        device.mode === 'normal' &&
        device.firmware !== 'required';
    if (!isDeviceReady) return;

    if (device.features && device.features.passphrase_protection) {
        dispatch({
            type: SUITE.REQUEST_PASSPHRASE_MODE,
            payload: device,
        });
    } else {
        dispatch({
            type: SUITE.RECEIVE_PASSPHRASE_MODE,
            payload: device,
            hidden: false,
        });
    }
};

export const authorizeDevice = () => async (dispatch: Dispatch, getState: GetState) => {
    const { device } = getState().suite;
    if (!device) return;
    const isDeviceReady =
        device.connected &&
        device.features &&
        !device.state &&
        device.mode === 'normal' &&
        device.firmware !== 'required';
    if (!isDeviceReady) return;

    dispatch(lockUI(true));
    const response = await TrezorConnect.getDeviceState({
        device: {
            path: device.path,
            instance: device.instance,
            state: device.state,
        },
        // useEmptyPassphrase: device.useEmptyPassphrase,
        useEmptyPassphrase: false,
    });
    dispatch(lockUI(false));

    if (response.success) {
        dispatch({
            type: SUITE.AUTH_DEVICE,
            payload: device,
            state: response.payload.state,
        });
    } else {
        // TODO: notification with error
        // dispatch();
    }
};
