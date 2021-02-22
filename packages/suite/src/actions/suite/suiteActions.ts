import TrezorConnect, { Device, DEVICE } from 'trezor-connect';
import * as comparisonUtils from '@suite-utils/comparisonUtils';
import * as deviceUtils from '@suite-utils/device';
import { addToast } from '@suite-actions/notificationActions';
import * as modalActions from '@suite-actions/modalActions';
import * as storageActions from '@suite-actions/storageActions';
import { getOSTheme } from '@suite-utils/env';
import { SUITE, METADATA } from './constants';
import { LANGUAGES } from '@suite-config';
import {
    Action,
    Dispatch,
    GetState,
    TrezorDevice,
    AppState,
    SuiteThemeVariant,
    SuiteThemeColors,
} from '@suite-types';
import { DebugModeOptions } from '@suite-reducers/suiteReducer';

export type SuiteAction =
    | { type: typeof SUITE.INIT }
    | { type: typeof SUITE.READY }
    | { type: typeof SUITE.ERROR; error: string }
    | { type: typeof SUITE.SET_DB_ERROR; payload: AppState['suite']['dbError'] }
    | { type: typeof SUITE.CONNECT_INITIALIZED }
    | { type: typeof SUITE.SELECT_DEVICE; payload?: TrezorDevice }
    | { type: typeof SUITE.UPDATE_SELECTED_DEVICE; payload: TrezorDevice }
    | {
          type: typeof SUITE.UPDATE_PASSPHRASE_MODE;
          payload: TrezorDevice;
          hidden: boolean;
          alwaysOnDevice?: boolean;
      }
    | { type: typeof SUITE.AUTH_DEVICE; payload: TrezorDevice; state: string }
    | { type: typeof SUITE.AUTH_FAILED; payload: TrezorDevice }
    | { type: typeof SUITE.REQUEST_AUTH_CONFIRM }
    | { type: typeof SUITE.RECEIVE_AUTH_CONFIRM; payload: TrezorDevice; success: boolean }
    | { type: typeof SUITE.CREATE_DEVICE_INSTANCE; payload: TrezorDevice }
    | { type: typeof SUITE.FORGET_DEVICE; payload: TrezorDevice }
    | {
          type: typeof SUITE.REMEMBER_DEVICE;
          payload: TrezorDevice;
          remember: boolean;
          forceRemember?: true;
      }
    | {
          type: typeof SUITE.SET_LANGUAGE;
          locale: typeof LANGUAGES[number]['code'];
          messages: { [key: string]: string };
      }
    | { type: typeof SUITE.SET_DEBUG_MODE; payload: Partial<DebugModeOptions> }
    | { type: typeof SUITE.ONLINE_STATUS; payload: boolean }
    | { type: typeof SUITE.TOR_STATUS; payload: boolean }
    | { type: typeof SUITE.ONION_LINKS; payload: boolean }
    | { type: typeof SUITE.LOCK_UI; payload: boolean }
    | { type: typeof SUITE.LOCK_DEVICE; payload: boolean }
    | { type: typeof SUITE.LOCK_ROUTER; payload: boolean }
    | {
          type: typeof SUITE.SET_FLAG;
          key: keyof AppState['suite']['flags'];
          value: boolean;
      }
    | { type: typeof SUITE.APP_CHANGED; payload: AppState['router']['app'] }
    | {
          type: typeof SUITE.ADD_BUTTON_REQUEST;
          device: TrezorDevice | undefined;
          payload?: string;
      }
    | {
          type: typeof SUITE.SET_PROCESS_MODE;
          device: TrezorDevice;
          payload: TrezorDevice['processMode'];
      }
    | {
          type: typeof SUITE.SET_THEME;
          variant: SuiteThemeVariant;
          colors: SuiteThemeColors;
      };

export const setDbError = (payload: AppState['suite']['dbError']) => ({
    type: SUITE.SET_DB_ERROR,
    payload,
});

export const setTheme = (variant: SuiteThemeVariant, colors?: SuiteThemeColors) => ({
    type: SUITE.SET_THEME,
    variant,
    colors,
});

export const setProcessMode = (
    device: TrezorDevice,
    processMode: TrezorDevice['processMode'],
): SuiteAction => ({
    type: SUITE.SET_PROCESS_MODE,
    device,
    payload: processMode,
});

export const setFlag = (key: keyof AppState['suite']['flags'], value: boolean): SuiteAction => ({
    type: SUITE.SET_FLAG,
    key,
    value,
});

export const initialRunCompleted = () => (dispatch: Dispatch, getState: GetState) => {
    if (getState().suite.flags.initialRun) {
        dispatch(setFlag('initialRun', false));
    }
};

/**
 * Triggered by `@suite-support/OnlineStatus` or `@suite-native/support/OnlineStatus`
 * Set `online` status in suite reducer
 * @param {boolean} payload
 * @returns {SuiteAction}
 */
export const updateOnlineStatus = (payload: boolean): SuiteAction => ({
    type: SUITE.ONLINE_STATUS,
    payload,
});

/**
 * Triggered by `@suite-support/TorStatus`
 * Set `tor` status in suite reducer
 * @param {boolean} payload
 * @returns {Action}
 */
export const updateTorStatus = (payload: boolean) => ({
    type: SUITE.TOR_STATUS,
    payload,
});

export const setOnionLinks = (payload: boolean) => ({
    type: SUITE.ONION_LINKS,
    payload,
});

/**
 * Called from `suiteMiddleware`
 * Set `loaded` field in suite reducer
 * @returns {SuiteAction}
 */
export const onSuiteReady = (): SuiteAction => ({
    type: SUITE.READY,
});

/**
 * Triggered by user action in:
 * - Debug Settings
 * Set `debug` object in suite reducer
 * @param {boolean} payload
 * @returns {SuiteAction}
 */
export const setDebugMode = (payload: Partial<DebugModeOptions>): SuiteAction => ({
    type: SUITE.SET_DEBUG_MODE,
    payload,
});

/**
 * Called from multiple places before and after TrezorConnect call
 * Prevent from mad clicking
 * Set `lock` field in suite reducer
 * @returns {SuiteAction}
 */
export const lockUI = (payload: boolean): SuiteAction => ({
    type: SUITE.LOCK_UI,
    payload,
});

/**
 * Prevent TrezorConnect multiple calls
 * Called before and after specific process, like onboarding
 * Set `lock` field in suite reducer
 * @returns {SuiteAction}
 */
export const lockDevice = (payload: boolean): SuiteAction => ({
    type: SUITE.LOCK_DEVICE,
    payload,
});

/**
 * Prevent route change and rendering
 * Called before and after specific process, like onboarding
 * Set `lock` field in suite reducer
 * @returns {SuiteAction}
 */
export const lockRouter = (payload: boolean): SuiteAction => ({
    type: SUITE.LOCK_ROUTER,
    payload,
});

/**
 * Called from:
 * - `trezor-connect` events handler `handleDeviceConnect`, `handleDeviceDisconnect`
 * - from user action in `@suite-components/DeviceMenu`
 * @param {(Device | TrezorDevice | undefined)} device
 */
export const selectDevice = (device?: Device | TrezorDevice) => (
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

export const rememberDevice = (payload: TrezorDevice, forceRemember?: true): SuiteAction => ({
    type: SUITE.REMEMBER_DEVICE,
    payload,
    remember: !payload.remember || !!forceRemember,
    // if device is already remembered, do not force it, it would remove the remember on return to suite
    forceRemember: payload.remember ? undefined : forceRemember,
});

export const forgetDevice = (payload: TrezorDevice): SuiteAction => ({
    type: SUITE.FORGET_DEVICE,
    payload,
});

/**
 * Triggered by `trezor-connect DEVICE_EVENT`
 * @param {Device} device
 * @param {boolean} [useEmptyPassphrase=false]
 */
export const createDeviceInstance = (device: TrezorDevice, useEmptyPassphrase = false) => async (
    dispatch: Dispatch,
    getState: GetState,
) => {
    if (!device.features) return;
    if (!device.features.passphrase_protection) {
        const response = await TrezorConnect.applySettings({
            device,
            // eslint-disable-next-line @typescript-eslint/naming-convention
            use_passphrase: true,
        });

        if (!response.success) {
            dispatch(addToast({ type: 'error', error: response.payload.error }));
            return;
        }

        dispatch(addToast({ type: 'settings-applied' }));
    }

    dispatch({
        type: SUITE.CREATE_DEVICE_INSTANCE,
        payload: {
            ...device,
            useEmptyPassphrase,
            instance: deviceUtils.getNewInstanceNumber(getState().devices, device),
            walletNumber: deviceUtils.getNewWalletNumber(getState().devices, device),
        },
    });
};

/**
 * Triggered by `trezor-connect DEVICE_EVENT`
 * @param {Device} device
 */
export const handleDeviceConnect = (device: Device) => (dispatch: Dispatch, getState: GetState) => {
    const selectedDevice = getState().suite.device;
    const { firmware } = getState();
    // todo:
    // We are waiting for device in bootloader mode (only in firmware update)
    if (
        selectedDevice &&
        device.features &&
        device.mode === 'bootloader' &&
        firmware.status === 'waiting-for-bootloader'
    ) {
        dispatch(selectDevice(device));
    }
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
    SUITE.AUTH_FAILED,
    SUITE.SELECT_DEVICE,
    SUITE.RECEIVE_AUTH_CONFIRM,
    SUITE.UPDATE_PASSPHRASE_MODE,
    SUITE.ADD_BUTTON_REQUEST,
    SUITE.REMEMBER_DEVICE,
    SUITE.FORGET_DEVICE,
    SUITE.SET_PROCESS_MODE,
    METADATA.SET_DEVICE_METADATA,
    METADATA.WALLET_LOADED,
    METADATA.WALLET_ADD,
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

    const changed = comparisonUtils.isChanged(selectedDevice, deviceFromReducer);
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
export const acquireDevice = (requestedDevice?: TrezorDevice) => async (
    dispatch: Dispatch,
    getState: GetState,
) => {
    const selectedDevice = getState().suite.device;
    if (!selectedDevice && !requestedDevice) return;
    const device = requestedDevice || selectedDevice;

    const response = await TrezorConnect.getFeatures({
        device,
        useEmptyPassphrase: true,
    });

    if (!response.success) {
        dispatch(
            addToast({
                type: 'acquire-error',
                device,
                error: response.payload.error,
            }),
        );
    }
};

/**
 * Inner action used in `authorizeDevice`
 */
const updatePassphraseMode = (device: TrezorDevice, hidden: boolean): SuiteAction => ({
    type: SUITE.UPDATE_PASSPHRASE_MODE,
    payload: device,
    hidden,
});

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
        const { state } = response.payload;
        const s = state.split(':')[0];
        const duplicate = getState().devices.find(
            d => d.state && d.state.split(':')[0] === s && d.instance !== device.instance,
        );
        if (duplicate) {
            // get fresh data from reducer, `useEmptyPassphrase` might be changed after TrezorConnect call
            const freshDeviceData = deviceUtils.getSelectedDevice(device, getState().devices);
            if (freshDeviceData!.useEmptyPassphrase) {
                // if currently selected device uses empty passphrase
                // make sure that founded duplicate will also use empty passphrase
                dispatch(updatePassphraseMode(duplicate, false));
                // reset useEmptyPassphrase field for selected device to allow future PassphraseRequests
                dispatch(updatePassphraseMode(device, true));
            }
            dispatch(modalActions.openModal({ type: 'passphrase-duplicate', device, duplicate }));
            return false;
        }

        dispatch({
            type: SUITE.AUTH_DEVICE,
            payload: device,
            state,
        });
        return true;
    }

    dispatch({ type: SUITE.AUTH_FAILED, payload: device });
    dispatch(addToast({ type: 'auth-failed', error: response.payload.error }));
    return false;
};

/**
 * Inner action used in `authConfirm`
 */
const receiveAuthConfirm = (device: TrezorDevice, success: boolean): SuiteAction => ({
    type: SUITE.RECEIVE_AUTH_CONFIRM,
    payload: device,
    success,
});

/**
 * Called from `suiteMiddleware`
 */
export const authConfirm = () => async (dispatch: Dispatch, getState: GetState) => {
    const { device } = getState().suite;
    if (!device) return false;

    const response = await TrezorConnect.getDeviceState({
        device: {
            path: device.path,
            instance: device.instance,
            state: undefined,
        },
        keepSession: false,
    });

    if (!response.success) {
        // handle error passed from Passphrase modal
        if (response.payload.error === 'auth-confirm-cancel') {
            // needs await to propagate all actions
            await dispatch(createDeviceInstance(device));
            // forget previous empty wallet
            dispatch(forgetDevice(device));
            return;
        }
        dispatch(addToast({ type: 'auth-confirm-error', error: response.payload.error }));
        dispatch(receiveAuthConfirm(device, false));
        return;
    }

    if (response.payload.state !== device.state) {
        dispatch(addToast({ type: 'auth-confirm-error' }));
        dispatch(receiveAuthConfirm(device, false));
        return;
    }

    dispatch(receiveAuthConfirm(device, true));
};

/**
 * Called from `suiteMiddleware`
 */
export const switchDuplicatedDevice = (device: TrezorDevice, duplicate: TrezorDevice) => async (
    dispatch: Dispatch,
) => {
    // close modal
    dispatch(modalActions.onCancel());
    // release session from authorizeDevice
    await TrezorConnect.getFeatures({
        device,
        keepSession: false,
    });

    // switch to existing wallet
    dispatch(selectDevice(duplicate));
    // remove stateless instance
    dispatch(forgetDevice(device));
};

export const setInitialTheme = () => async (dispatch: Dispatch, getState: GetState) => {
    try {
        const storedSettings = await storageActions.loadSuiteSettings();
        const isInitialRun = storedSettings?.flags.initialRun;
        const savedTheme = storedSettings?.settings.theme;
        const currentThemeVariant = getState().suite.settings.theme.variant;

        if (isInitialRun || !storedSettings) {
            // Initial run
            // set initial theme (light/dark) based on OS settings
            const osThemeVariant = getOSTheme();
            if (osThemeVariant !== currentThemeVariant) {
                dispatch(setTheme(osThemeVariant, undefined));
            }
        } else if (savedTheme && savedTheme.variant !== currentThemeVariant) {
            // set correct theme from the db (this will be a bit quicker than waiting for STORAGE.LOADED)
            dispatch(setTheme(savedTheme?.variant, savedTheme?.colors));
        }
    } catch (error) {
        console.log(error); // just simple log to skip sentry as we probably don't care that much about failed initial theme
    }
};
