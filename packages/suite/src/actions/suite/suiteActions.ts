import TrezorConnect, { Device, DEVICE } from 'trezor-connect';
import * as reducersUtils from '@suite-utils/reducers';
import * as deviceUtils from '@suite-utils/device';
import { getRoute } from '@suite-utils/router';
import { goto } from '@suite-actions/routerActions';
import { add as addNotification } from '@suite-actions/notificationActions';
import { SUITE } from './constants';
import { Action, Dispatch, GetState, TrezorDevice } from '@suite-types';

export type SuiteActions =
    | { type: typeof SUITE.INIT }
    | { type: typeof SUITE.READY }
    | { type: typeof SUITE.ERROR; error: string }
    | { type: typeof SUITE.INITIAL_RUN_COMPLETED }
    | { type: typeof SUITE.CONNECT_INITIALIZED }
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
    | { type: typeof SUITE.TOGGLE_DEVICE_MENU; payload: boolean }
    | { type: typeof SUITE.TOGGLE_SIDEBAR }
    | { type: typeof SUITE.ONLINE_STATUS; payload: boolean }
    | { type: typeof SUITE.LOCK_UI; payload: boolean }
    | { type: typeof SUITE.LOCK_ROUTER; payload: boolean };

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
 * Triggered by user action in `@suite-components/DeviceMenu`
 * Set `deviceMenuOpened` field in suite reducer
 * @param {boolean} payload
 * @returns {Action}
 */
export const toggleDeviceMenu = (payload: boolean) => ({
    type: SUITE.TOGGLE_DEVICE_MENU,
    payload,
});

/**
 * Triggered by user action in:
 * - `@suite-components/Layout`
 * - `@wallet-components/Layout/Sidebar`
 * Set `showSidebar` field in suite reducer
 * @param {boolean} payload
 * @returns {Action}
 */
export const toggleSidebar = (): Action => ({
    type: SUITE.TOGGLE_SIDEBAR,
});

/**
 * Called from multiple places before and after TrezorConnect call
 * Prevent from mad clicking
 * Set `uiLocked` field in suite reducer
 * @returns {Action}
 */
export const lockUI = (payload: boolean): Action => ({
    type: SUITE.LOCK_UI,
    payload,
});

/**
 * Prevent route change and rendering
 * Called before and after specific process, like onboarding
 * Set `routerLocked` field in suite reducer
 * @returns {Action}
 */
export const lockRouter = (payload: boolean): Action => ({
    type: SUITE.LOCK_ROUTER,
    payload,
});

/**
 * Called from user action in `@suite-components/DeviceMenu`
 * Show modal with possible decisions
 * @param {TrezorDevice} payload
 */
export const requestForgetDevice = (payload: TrezorDevice) => ({
    type: SUITE.REQUEST_FORGET_DEVICE,
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
    // 1. check if ui is not locked by device request or application itself (for example onboarding process)
    const { uiLocked, routerLocked } = getState().suite;
    if (uiLocked || routerLocked) return;
    // 2. check if device is acquired

    if (device && device.features) {
        const { app } = getState().router;
        // 3. device is not initialized, redirect to "onboarding"
        if (device.mode === 'initialize' && app !== 'onboarding') {
            await goto(getRoute('onboarding-index'));
        }
        // 4. device firmware update required, redirect to "firmware update"
        // if (device.firmware === 'required' && app !== 'suite-firmware-update') {
        //     await goto(getRoute('suite-firmware-update'));
        // }
    }

    let payload: TrezorDevice | typeof undefined;
    // 5. find possible instances
    if (device) {
        const { instanceLabel } = device as TrezorDevice;
        if (typeof instanceLabel === 'string') {
            // requested device is a @suite TrezorDevice type. get exact instance from reducer
            payload = deviceUtils.getSelectedDevice(device as TrezorDevice, getState().devices);
        } else {
            // requested device is a trezor-connect Device type
            // find all instances and select recently used
            const instances = getState().devices.filter(d => d.path === device.path);
            // eslint-disable-next-line prefer-destructuring
            payload = deviceUtils.sort(instances)[0];
        }
    }

    // 5. select requested device
    dispatch({
        type: SUITE.SELECT_DEVICE,
        payload,
    });

    // eslint-disable-next-line @typescript-eslint/no-use-before-define
    // dispatch(authorizeDevice());
};

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
    if (!selected) return;
    if (selected.path !== device.path) return;

    // selected device is disconnected, decide what to do next
    const { devices } = getState();
    const { routerLocked } = getState().suite;
    if (devices.length < 1 || routerLocked) {
        dispatch({ type: SUITE.SELECT_DEVICE });
        return;
    }
    const unacquired = devices.find(d => !d.features);
    if (unacquired) {
        dispatch({ type: SUITE.SELECT_DEVICE, payload: unacquired });
    } else {
        const latest = deviceUtils.sort(devices);
        const firstConnected = latest.find(d => d.connected);
        dispatch({ type: SUITE.SELECT_DEVICE, payload: firstConnected || latest[0] });
    }
};

/**
 * list of actions which has influence on `device` field inside `suite` reducer
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
    if (!deviceFromReducer) return true;
    const changed = reducersUtils.observeChanges(selected, deviceFromReducer);
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

    dispatch(lockUI(true));
    const response = await TrezorConnect.getFeatures({
        device: {
            path: device.path,
        },
        useEmptyPassphrase: true,
    });
    dispatch(lockUI(false));

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
 * Called from `walletMiddleware`
 * Show modal and ask user if he wants to use passphrase or not
 * Skip if device has `passphrase_protection` disabled
 */
export const requestPassphraseMode = () => async (dispatch: Dispatch, getState: GetState) => {
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
/**
 * Called from `walletMiddleware`
 * Fetch device state, update `devices` reducer as result of SUITE.AUTH_DEVICE
 */
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
        useEmptyPassphrase: device.useEmptyPassphrase,
        // useEmptyPassphrase: false,
    });
    dispatch(lockUI(false));

    if (response.success) {
        dispatch({
            type: SUITE.AUTH_DEVICE,
            payload: device,
            state: response.payload.state,
        });
    } else {
        // TODO: notification with translations
        dispatch(
            addNotification({
                variant: 'error',
                title: 'authorizeDevice error',
                cancelable: true,
            }),
        );
    }
};
