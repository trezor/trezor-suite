import TrezorConnect, { Device, DEVICE } from 'trezor-connect';
import * as reducersUtils from '@suite-utils/reducerUtils';
import * as deviceUtils from '@suite-utils/device';
import { add as addNotification } from '@suite-actions/notificationActions';
import { SUITE } from './constants';
import { LANGUAGES } from '@suite-config';
import { Action, Dispatch, GetState, TrezorDevice, AcquiredDevice, AppState } from '@suite-types';
import { DebugModeOptions } from '@suite-reducers/suiteReducer';

export type SuiteActions =
    | { type: typeof SUITE.INIT }
    | { type: typeof SUITE.READY }
    | { type: typeof SUITE.ERROR; error: string }
    | { type: typeof SUITE.INITIAL_RUN_COMPLETED }
    | { type: typeof SUITE.CONNECT_INITIALIZED }
    | { type: typeof SUITE.SELECT_DEVICE; payload?: TrezorDevice }
    | { type: typeof SUITE.UPDATE_SELECTED_DEVICE; payload: TrezorDevice }
    | { type: typeof SUITE.UPDATE_PASSPHRASE_MODE; payload: TrezorDevice; hidden: boolean }
    | { type: typeof SUITE.AUTH_DEVICE; payload: TrezorDevice; state: string }
    | { type: typeof SUITE.REQUEST_AUTH_CONFIRM }
    | { type: typeof SUITE.RECEIVE_AUTH_CONFIRM; payload: TrezorDevice; success: boolean }
    | { type: typeof SUITE.CREATE_DEVICE_INSTANCE; payload: TrezorDevice }
    | { type: typeof SUITE.FORGET_DEVICE; payload: TrezorDevice }
    | { type: typeof SUITE.FORGET_DEVICE_INSTANCE; payload: TrezorDevice }
    | { type: typeof SUITE.REMEMBER_DEVICE; payload: TrezorDevice }
    | {
          type: typeof SUITE.SET_LANGUAGE;
          locale: typeof LANGUAGES[number]['code'];
          messages: { [key: string]: string };
      }
    | { type: typeof SUITE.SET_DEBUG_MODE; payload: DebugModeOptions }
    | { type: typeof SUITE.ONLINE_STATUS; payload: boolean }
    | { type: typeof SUITE.LOCK_UI; payload: boolean }
    | { type: typeof SUITE.LOCK_DEVICE; payload: boolean }
    | { type: typeof SUITE.LOCK_ROUTER; payload: boolean }
    | { type: typeof SUITE.APP_CHANGED; payload: AppState['router']['app'] };

/**
 * @returns {Action|void}
 */
export const initialRunCompleted = () => (dispatch: Dispatch, getState: GetState) => {
    if (getState().suite.initialRun) {
        dispatch({
            type: SUITE.INITIAL_RUN_COMPLETED,
        });
    }
};

/**
 * Triggered by `@suite-support/OnlineStatus` or `@suite-native/support/OnlineStatus`
 * Set `online` status in suite reducer
 * @param {boolean} payload
 * @returns {Action}
 */
export const updateOnlineStatus = (payload: boolean) => ({
    type: SUITE.ONLINE_STATUS,
    payload,
});

/**
 * Called from `suiteMiddleware`
 * Set `loaded` field in suite reducer
 * @returns {Action}
 */
export const onSuiteReady = (): Action => ({
    type: SUITE.READY,
});

/**
 * Triggered by user action in:
 * - Debug Settings
 * Set `debug` object in suite reducer
 * @param {boolean} payload
 * @returns {Action}
 */
export const setDebugMode = (payload: DebugModeOptions): Action => ({
    type: SUITE.SET_DEBUG_MODE,
    payload,
});

/**
 * Called from multiple places before and after TrezorConnect call
 * Prevent from mad clicking
 * Set `lock` field in suite reducer
 * @returns {Action}
 */
export const lockUI = (payload: boolean): Action => ({
    type: SUITE.LOCK_UI,
    payload,
});

/**
 * Prevent TrezorConnect multiple calls
 * Called before and after specific process, like onboarding
 * Set `lock` field in suite reducer
 * @returns {Action}
 */
export const lockDevice = (payload: boolean): Action => ({
    type: SUITE.LOCK_DEVICE,
    payload,
});

/**
 * Prevent route change and rendering
 * Called before and after specific process, like onboarding
 * Set `lock` field in suite reducer
 * @returns {Action}
 */
export const lockRouter = (payload: boolean): Action => ({
    type: SUITE.LOCK_ROUTER,
    payload,
});

/**
 * Called from:
 * - `trezor-connect` events handler `handleDeviceConnect`, `handleDeviceDisconnect`
 * - from user action in `@suite-components/DeviceMenu`
 * @param {(Device | TrezorDevice | undefined)} device
 */
export const selectDevice = (device?: Device | TrezorDevice) => async (
    dispatch: Dispatch,
    getState: GetState,
) => {
    let payload: TrezorDevice | typeof undefined;
    if (device) {
        // "ts" is one of the field which distinguish Device from TrezorDevice
        const { ts } = device as TrezorDevice;
        if (typeof ts === 'number') {
            // requested device is a @suite TrezorDevice type. get exact instance from reducer
            payload = deviceUtils.getSelectedDevice(device as TrezorDevice, getState().devices);
        } else {
            // requested device is a trezor-connect Device type
            // find all instances and select recently used
            const instances = getState().devices.filter(d => d.path === device.path);
            // eslint-disable-next-line prefer-destructuring
            payload = deviceUtils.sortByTimestamp(instances)[0];
        }
    }

    // 3. select requested device
    dispatch({
        type: SUITE.SELECT_DEVICE,
        payload,
    });
};

export const rememberDevice = (payload: TrezorDevice): Action => ({
    type: SUITE.REMEMBER_DEVICE,
    payload,
});

export const forgetDevice = (payload: TrezorDevice): Action => ({
    type: SUITE.FORGET_DEVICE,
    payload,
});

export const forgetDeviceInstance = (payload: TrezorDevice): Action => ({
    type: SUITE.FORGET_DEVICE_INSTANCE,
    payload,
});

/**
 * Triggered by `trezor-connect DEVICE_EVENT`
 * @param {Device} device
 */
export const createDeviceInstance = (device: TrezorDevice, useEmptyPassphrase = false) => async (
    dispatch: Dispatch,
    getState: GetState,
) => {
    if (!device.features) return;
    if (!device.features.passphrase_protection) {
        // TODO: enable passphrase
        const response = await TrezorConnect.applySettings({
            device,
            // eslint-disable-next-line @typescript-eslint/camelcase
            use_passphrase: true,
        });
        if (!response.success) {
            // TODO: show fail notification
            return;
        }
        // TODO: show success notification
    }

    dispatch({
        type: SUITE.CREATE_DEVICE_INSTANCE,
        payload: {
            ...device,
            useEmptyPassphrase,
            instance: !useEmptyPassphrase
                ? deviceUtils.getNewInstanceNumber(getState().devices, device as AcquiredDevice)
                : undefined,
        },
    });
};

/**
 * Triggered by `trezor-connect DEVICE_EVENT`
 * @param {Device} device
 */
export const handleDeviceConnect = (device: Device) => (dispatch: Dispatch, getState: GetState) => {
    const selectedDevice = getState().suite.device;
    // todo:
    // We are waiting for device in bootloader mode (only in firmware update)
    // if (selectedDevice && device.mode === 'bootloader' && 'waiting-for-bootloader-todo') {
    //     dispatch(selectDevice(device));
    // }
    if (!selectedDevice) {
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
    const selectedDevice = getState().suite.device;
    if (!selectedDevice) return;
    if (selectedDevice.path !== device.path) return;

    // selected device is disconnected, decide what to do next
    const { devices } = getState();
    // device is still present in reducer (remembered or candidate to remember)
    const devicePresent = deviceUtils.getSelectedDevice(selectedDevice, devices);
    const deviceInstances = deviceUtils.getDeviceInstances(selectedDevice, devices);
    if (deviceInstances.length > 0) {
        // if selected device is gone from reducer, switch to first instance
        if (!devicePresent) {
            dispatch({ type: SUITE.SELECT_DEVICE, payload: deviceInstances[0] });
        }
        return;
    }
    // const routerLocked = getState().suite.locks.includes(SUITE.LOCK_TYPE.ROUTER);
    // if (devices.length < 1 || routerLocked) {
    //     dispatch({ type: SUITE.SELECT_DEVICE });
    //     return;
    // }

    const available = deviceUtils.getFirstDeviceInstance(devices);
    dispatch({ type: SUITE.SELECT_DEVICE, payload: available[0] });
};

/**
 * list of actions which has influence on `device` field inside `suite` reducer
 * all other actions should be ignored
 */
const actions = [
    SUITE.AUTH_DEVICE,
    SUITE.SELECT_DEVICE,
    SUITE.RECEIVE_AUTH_CONFIRM,
    SUITE.UPDATE_PASSPHRASE_MODE,
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

    const selectedDevice = getState().suite.device;
    if (!selectedDevice) return false;

    const deviceFromReducer = deviceUtils.getSelectedDevice(selectedDevice, getState().devices);
    if (!deviceFromReducer) return true;

    const changed = reducersUtils.observeChanges(selectedDevice, deviceFromReducer);
    if (changed) {
        dispatch({
            type: SUITE.UPDATE_SELECTED_DEVICE,
            payload: deviceFromReducer,
        });
    }

    return changed;
};

/**
 * Called from <AcquireDevice /> component
 * Fetch device features without asking for pin/passphrase
 * this is the only place where useEmptyPassphrase should be always set to "true"
 */
export const acquireDevice = () => async (dispatch: Dispatch, getState: GetState) => {
    const { device } = getState().suite;
    if (!device) return;

    const response = await TrezorConnect.getFeatures({
        device: {
            path: device.path,
        },
        useEmptyPassphrase: true,
    });

    if (!response.success) {
        // TODO: notification with translations
        dispatch(
            addNotification({
                variant: 'error',
                title: 'Acquire device error',
                cancelable: true,
            }),
        );
    }
};

/**
 * Called from `discoveryMiddleware`
 * Fetch device state, update `devices` reducer as result of SUITE.AUTH_DEVICE
 */
export const authorizeDevice = () => async (
    dispatch: Dispatch,
    getState: GetState,
): Promise<boolean> => {
    const { device } = getState().suite;
    if (!device) return false;
    const isDeviceReady =
        device.connected &&
        device.features &&
        !device.state &&
        device.mode === 'normal' &&
        device.firmware !== 'required';
    if (!isDeviceReady) return false;

    const response = await TrezorConnect.getDeviceState({
        device: {
            path: device.path,
            instance: device.instance,
            state: undefined,
        },
        keepSession: true,
        useEmptyPassphrase: device.useEmptyPassphrase,
    });

    if (response.success) {
        // TODO: catch already existing state here (new passphrase design)
        dispatch({
            type: SUITE.AUTH_DEVICE,
            payload: device,
            state: response.payload.state,
        });
        return true;
    }
    // TODO: notification with translations
    dispatch(
        addNotification({
            variant: 'error',
            title: 'Authorize device error',
            message: response.payload.error,
            cancelable: true,
            actions: [
                {
                    label: 'Retry',
                    callback: () => dispatch(authorizeDevice()),
                },
            ],
        }),
    );
    return false;
};

/**
 * Inner action used in `authConfirm` and `retryAuthConfirm`
 */
const receiveAuthConfirm = (device: TrezorDevice, success: boolean): Action => ({
    type: SUITE.RECEIVE_AUTH_CONFIRM,
    payload: device,
    success,
});

/**
 * Triggered by user action in `AuthConfirm` component
 */
export const retryAuthConfirm = () => async (dispatch: Dispatch, getState: GetState) => {
    const { device } = getState().suite;
    if (!device) return;
    const response = await TrezorConnect.getDeviceState({
        device: {
            path: device.path,
            instance: device.instance,
            state: device.state,
        },
        useEmptyPassphrase: device.useEmptyPassphrase,
    });

    if (response.success) {
        dispatch(receiveAuthConfirm(device, true));
        return;
    }

    // TODO: add code to trezor-connect
    if (response.payload.error !== 'Passphrase is incorrect') {
        // TODO: notification with translations
        dispatch(
            addNotification({
                variant: 'error',
                title: 'Passphrase confirmation failed',
                message: response.payload.error,
                cancelable: true,
            }),
        );
    }
};

/**
 * Called from `suiteMiddleware`
 */
export const authConfirm = () => async (dispatch: Dispatch, getState: GetState) => {
    const { device } = getState().suite;
    if (!device) return false;

    // Fetch current state first bitcoin address to have some value to compare
    // TODO: with new passphrase design call .getDeviceState
    const currentAddress = await TrezorConnect.getAddress({
        device: {
            path: device.path,
            instance: device.instance,
            state: device.state,
        },
        path: "m/49'/0'/0'/0/0",
        showOnTrezor: false,
        useEmptyPassphrase: false,
        keepSession: false, // reset session, next request will enforce passphrase
    });

    if (!currentAddress.success) {
        // TODO: notification translations
        dispatch(
            addNotification({
                variant: 'error',
                title: 'Passphrase confirmation failed',
                message: currentAddress.payload.error,
                cancelable: true,
            }),
        );
        dispatch(receiveAuthConfirm(device, false));
        return;
    }

    // Fetch first bitcoin address this time reset device.state to enforce passphrase
    const confirmedAddress = await TrezorConnect.getAddress({
        device: {
            path: device.path,
            instance: device.instance,
            state: undefined, // reset state
        },
        path: "m/49'/0'/0'/0/0",
        showOnTrezor: false,
        useEmptyPassphrase: false,
    });

    if (!confirmedAddress.success) {
        // TODO: notification translations
        dispatch(
            addNotification({
                variant: 'error',
                title: 'Passphrase confirmation failed',
                message: confirmedAddress.payload.error,
                cancelable: true,
            }),
        );
        dispatch(receiveAuthConfirm(device, false));
        return;
    }

    if (currentAddress.payload.address !== confirmedAddress.payload.address) {
        dispatch(receiveAuthConfirm(device, false));
        return;
    }

    dispatch(receiveAuthConfirm(device, true));
};
