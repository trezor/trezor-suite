import { createThunk } from '@suite-common/redux-utils';
import TrezorConnect, { Device } from '@trezor/connect';
import { TrezorDevice } from '@suite-common/suite-types';
import { analytics, EventType } from '@trezor/suite-analytics';
import { notificationsActions } from '@suite-common/toast-notifications';
import {
    sortByTimestamp,
    isChanged,
    getSelectedDevice,
    getNewInstanceNumber,
    getDeviceInstances,
    getFirstDeviceInstance,
} from '@suite-common/suite-utils';
import { AccountKey } from '@suite-common/wallet-types';
import {
    getAddressType,
    getDerivationType,
    getNetworkId,
    getProtocolMagic,
    getStakingPath,
} from '@suite-common/wallet-utils';

import {
    selectDevice,
    selectDevice as selectDeviceSelector,
    selectDeviceById,
    selectDevices,
} from './deviceReducer';
import { deviceActions, MODULE_PREFIX } from './deviceActions';
import { selectFirmware } from '../firmware/firmwareReducer';
import { checkFirmwareAuthenticity } from '../firmware/firmwareThunks';
import { PORTFOLIO_TRACKER_DEVICE_ID, portfolioTrackerDevice } from './deviceConstants';
import { selectAccountByKey } from '../accounts/accountsReducer';

/**
 * Called from:
 * - `@trezor/connect` events handler `handleDeviceConnect`, `handleDeviceDisconnect`
 * - from user action in `@suite-components/DeviceMenu`
 * @param {(Device | TrezorDevice | undefined)} device
 */
export const selectDeviceThunk = createThunk(
    `${MODULE_PREFIX}/selectDevice`,
    (device: Device | TrezorDevice | undefined, { dispatch, getState }) => {
        let payload: TrezorDevice | typeof undefined;
        const devices = selectDevices(getState());

        if (device) {
            // "ts" is one of the field which distinguish Device from TrezorDevice
            // (device from connect doesn't have timestampp but suite device has)
            if ('ts' in device) {
                // requested device is a @suite TrezorDevice type. get exact instance from reducer
                payload = getSelectedDevice(device, devices);
            } else {
                // requested device is a @trezor/connect Device type
                // find all instances and select recently used
                const instances = devices.filter(d => d.path === device.path);
                // eslint-disable-next-line prefer-destructuring
                payload = sortByTimestamp(instances)[0];
            }
        }

        // 3. select requested device
        dispatch(deviceActions.selectDevice(payload));
    },
);

/**
 * Toggles remembering the given device. I.e. if given device is not remembered it will become remembered
 * and if it is remembered it will be forgotten.
 * @param forceRemember can be set to `true` to remember given device regardless of its current state.
 *
 * Use `forgetDevice` to forget a device regardless if its current state.
 */
export const toggleRememberDevice = createThunk(
    `${MODULE_PREFIX}/toggleRememberDevice`,
    ({ device, forceRemember }: { device: TrezorDevice; forceRemember?: true }, { dispatch }) => {
        analytics.report({
            type: device.remember ? EventType.SwitchDeviceForget : EventType.SwitchDeviceRemember,
        });
        return dispatch(
            deviceActions.rememberDevice({
                device,
                remember: !device.remember || !!forceRemember,
                // if device is already remembered, do not force it, it would remove the remember on return to suite
                forceRemember: device.remember ? undefined : forceRemember,
            }),
        );
    },
);

/**
 * Triggered by `@trezor/connect DEVICE_EVENT`
 * @param {Device} device
 * @param {boolean} [useEmptyPassphrase=false]
 */
export const createDeviceInstance = createThunk(
    `${MODULE_PREFIX}/createDeviceInstance`,
    async (
        {
            device,
            useEmptyPassphrase = false,
        }: { device: TrezorDevice; useEmptyPassphrase?: boolean },
        { dispatch, getState },
    ) => {
        if (!device.features) return;
        if (!device.features.passphrase_protection) {
            const response = await TrezorConnect.applySettings({
                device,
                use_passphrase: true,
            });

            if (!response.success) {
                dispatch(
                    notificationsActions.addToast({ type: 'error', error: response.payload.error }),
                );
                return;
            }

            dispatch(notificationsActions.addToast({ type: 'settings-applied' }));
        }

        const devices = selectDevices(getState());
        dispatch(
            deviceActions.createDeviceInstance({
                ...device,
                useEmptyPassphrase,
                instance: getNewInstanceNumber(devices, device),
            }),
        );
    },
);

/**
 * Triggered by `@trezor/connect DEVICE_EVENT`
 * @param {Device} device
 */
export const handleDeviceConnect = createThunk(
    `${MODULE_PREFIX}/handleDeviceConnect`,
    (device: Device, { dispatch, getState }) => {
        const selectedDevice = selectDeviceSelector(getState());
        const firmware = selectFirmware(getState());
        // We are waiting for device in bootloader mode (only in firmware update)
        if (
            selectedDevice &&
            device.features &&
            device.mode === 'bootloader' &&
            ['reconnect-in-normal', 'waiting-for-bootloader'].includes(firmware.status)
        ) {
            dispatch(selectDeviceThunk(device));
        }
        if (!selectedDevice) {
            dispatch(selectDeviceThunk(device));
        } else {
            // TODO: show some nice notification/tooltip in DeviceMenu
        }
    },
);

/**
 * Triggered by `@trezor/connect DEVICE_EVENT`
 * @param {Device} device
 */
export const handleDeviceDisconnect = createThunk(
    `${MODULE_PREFIX}/handleDeviceDisconnect`,
    (device: Device, { dispatch, getState, extra }) => {
        const {
            selectors: { selectRouterApp },
        } = extra;

        const selectedDevice = selectDeviceSelector(getState());
        const routerApp = selectRouterApp(getState());
        const devices = selectDevices(getState());
        if (!selectedDevice) return;
        if (selectedDevice.path !== device.path) return;

        /**
         * Under normal circumstances, after device is disconnected we want suite to select another existing device (either remembered or physically connected)
         * This is not the case in firmware update and onboarding; In this case we simply wan't suite.device to be empty until user reconnects a device again
         */
        if (['onboarding', 'firmware', 'firmware-type'].includes(routerApp)) {
            dispatch(selectDeviceThunk(undefined));
            return;
        }

        // selected device is disconnected, decide what to do next
        // device is still present in reducer (remembered or candidate to remember)
        const devicePresent = getSelectedDevice(selectedDevice, devices);
        const deviceInstances = getDeviceInstances(selectedDevice, devices);
        if (deviceInstances.length > 0) {
            // if selected device is gone from reducer, switch to first instance
            if (!devicePresent) {
                dispatch(selectDeviceThunk(deviceInstances[0]));
            }
            return;
        }

        const available = getFirstDeviceInstance(devices);
        dispatch(selectDeviceThunk(available[0]));
    },
);

/**
 * Triggered by `@trezor/connect DEVICE_EVENT` via suiteMiddleware
 * Remove all data related to all instances of disconnected device if they are not remembered
 * @param {Device} device
 */
export const forgetDisconnectedDevices = createThunk(
    `${MODULE_PREFIX}/forgetDisconnectedDevices`,
    (device: Device, { dispatch, getState }) => {
        const devices = selectDevices(getState());
        const deviceInstances = devices.filter(d => d.id === device.id);
        deviceInstances.forEach(d => {
            if (d.features && !d.remember) {
                dispatch(deviceActions.forgetDevice(d));
            }
        });
    },
);

/**
 * Called from `suiteMiddleware`
 * Keep `suite` reducer synchronized with `devices` reducer
 * @param {Action} action
 */
export const observeSelectedDevice = () => (dispatch: any, getState: any) => {
    const devices = selectDevices(getState());
    const selectedDevice = selectDeviceSelector(getState());

    if (!selectedDevice) return false;

    const deviceFromReducer = getSelectedDevice(selectedDevice, devices);
    if (!deviceFromReducer) return true;

    const changed = isChanged(selectedDevice, deviceFromReducer);
    if (changed) {
        dispatch(deviceActions.updateSelectedDevice(deviceFromReducer));
    }

    return changed;
};

/**
 * Called from <AcquireDevice /> component
 * Fetch device features without asking for pin/passphrase
 * this is the only place where useEmptyPassphrase should be always set to "true"
 */
export const acquireDevice = createThunk(
    `${MODULE_PREFIX}/acquireDevice`,
    async (requestedDevice: TrezorDevice | undefined, { dispatch, getState }) => {
        const selectedDevice = selectDeviceSelector(getState());
        if (!selectedDevice && !requestedDevice) return;
        const device = requestedDevice || selectedDevice;

        const response = await TrezorConnect.getFeatures({
            device,
            useEmptyPassphrase: true,
        });

        if (!response.success) {
            dispatch(
                notificationsActions.addToast({
                    type: 'acquire-error',
                    device,
                    error: response.payload.error,
                }),
            );
        }
    },
);

/**
 * Called from `discoveryMiddleware`
 * Fetch device state, update `devices` reducer as result of SUITE.AUTH_DEVICE
 */
export const authorizeDevice = createThunk(
    `${MODULE_PREFIX}/authorizeDevice`,
    async (
        // TODO: isUseEmptyPassphraseForced will be removed once the suite-native has support for passphrase authorization.
        {
            isUseEmptyPassphraseForced = false,
        }: { isUseEmptyPassphraseForced?: boolean } | undefined = {},
        { dispatch, getState, extra },
    ): Promise<boolean> => {
        const {
            selectors: { selectCheckFirmwareAuthenticity },
            actions: { openModal },
        } = extra;

        const selectedCheckFirmwareAuthenticity = selectCheckFirmwareAuthenticity(getState());
        const device = selectDeviceSelector(getState());
        if (!device) return false;
        const isDeviceReady =
            device.connected &&
            device.features &&
            !device.state &&
            device.mode === 'normal' &&
            device.firmware !== 'required';
        if (!isDeviceReady) return false;

        if (selectedCheckFirmwareAuthenticity) {
            await dispatch(checkFirmwareAuthenticity());
        }

        // The suite-native does not have support for passphrase authorization, so the `useEmptyPassphrase` has to be hardcoded to `true` in that case.
        // The thunk argument `isUseEmptyPassphraseForced` can be removed once the passphrase support is implemented in suite-native.
        const useEmptyPassphrase = isUseEmptyPassphraseForced || device.useEmptyPassphrase;

        const response = await TrezorConnect.getDeviceState({
            device: {
                path: device.path,
                instance: device.instance,
                state: undefined,
            },
            keepSession: true,
            useEmptyPassphrase,
        });

        if (response.success) {
            const { state } = response.payload;
            const s = state.split(':')[0];
            const devices = selectDevices(getState());
            const duplicate = devices?.find(
                d => d.state && d.state.split(':')[0] === s && d.instance !== device.instance,
            );
            // get fresh data from reducer, `useEmptyPassphrase` might be changed after TrezorConnect call
            const freshDeviceData = getSelectedDevice(device, devices);
            if (duplicate) {
                if (freshDeviceData!.useEmptyPassphrase) {
                    // if currently selected device uses empty passphrase
                    // make sure that founded duplicate will also use empty passphrase
                    dispatch(
                        deviceActions.updatePassphraseMode({ device: duplicate, hidden: false }),
                    );
                    // reset useEmptyPassphrase field for selected device to allow future PassphraseRequests
                    dispatch(deviceActions.updatePassphraseMode({ device, hidden: true }));
                }
                dispatch(openModal({ type: 'passphrase-duplicate', device, duplicate }));
                return false;
            }

            dispatch(deviceActions.authDevice({ device: freshDeviceData as TrezorDevice, state }));

            return true;
        }

        dispatch(deviceActions.authFailed(device));
        dispatch(
            notificationsActions.addToast({ type: 'auth-failed', error: response.payload.error }),
        );
        return false;
    },
);

/**
 * Called from `suiteMiddleware`
 */
export const authConfirm = createThunk(
    `${MODULE_PREFIX}/authConfirm`,
    async (_, { dispatch, getState }) => {
        const device = selectDeviceSelector(getState());
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
                await dispatch(createDeviceInstance({ device }));
                // forget previous empty wallet
                dispatch(deviceActions.forgetDevice(device));
                return;
            }
            dispatch(
                notificationsActions.addToast({
                    type: 'auth-confirm-error',
                    error: response.payload.error,
                }),
            );
            dispatch(deviceActions.receiveAuthConfirm({ device, success: false }));
            return;
        }

        if (response.payload.state !== device.state) {
            dispatch(notificationsActions.addToast({ type: 'auth-confirm-error' }));
            dispatch(deviceActions.receiveAuthConfirm({ device, success: false }));
            return;
        }

        dispatch(deviceActions.receiveAuthConfirm({ device, success: true }));
    },
);

export const switchDuplicatedDevice = createThunk(
    `${MODULE_PREFIX}/switchDuplicatedDevice`,
    async (
        { device, duplicate }: { device: TrezorDevice; duplicate: TrezorDevice },
        { dispatch, extra },
    ) => {
        const {
            actions: { onModalCancel },
        } = extra;
        // close modal
        dispatch(onModalCancel());
        // release session from authorizeDevice
        await TrezorConnect.getFeatures({
            device,
            keepSession: false,
        });

        // switch to existing wallet
        // NOTE: await is important. otherwise `forgetDevice` action will be resolved first leading to race condition:
        // forgetDevice > suiteMiddleware > handleDeviceDisconnect > selectDevice (first available)
        await dispatch(selectDeviceThunk(duplicate));
        // remove stateless instance
        dispatch(deviceActions.forgetDevice(device));
    },
);

export const initDevices = createThunk(
    `${MODULE_PREFIX}/initDevices`,
    (_, { dispatch, getState }) => {
        const devices = selectDevices(getState());
        const device = selectDeviceSelector(getState());

        if (!device && devices && devices[0]) {
            // if there are force remember devices, forget them and pick the first one of them as selected device
            const forcedDevices = devices.filter(d => d.forceRemember && d.remember);
            forcedDevices.forEach(d => {
                dispatch(toggleRememberDevice({ device: d }));
            });
            dispatch(
                selectDeviceThunk(
                    forcedDevices.length ? forcedDevices[0] : sortByTimestamp([...devices])[0],
                ),
            );
        }
    },
);

export const createImportedDeviceThunk = createThunk(
    `${MODULE_PREFIX}/createImportedDevice`,
    (_, { getState, dispatch }) => {
        const device = selectDeviceById(getState(), PORTFOLIO_TRACKER_DEVICE_ID);

        if (!device) {
            dispatch(deviceActions.createDeviceInstance(portfolioTrackerDevice));
        }
    },
);

export const confirmAddressOnDeviceThunk = createThunk(
    `${MODULE_PREFIX}/confirmAddressOnDeviceThunk`,
    async (
        {
            accountKey,
            addressPath,
            chunkify,
        }: { accountKey: AccountKey; addressPath: string; chunkify: boolean },
        { getState },
    ) => {
        const device = selectDevice(getState());
        const account = selectAccountByKey(getState(), accountKey);

        if (!device || !account)
            return {
                success: false,
                payload: { error: 'Device or account does not exist.', code: undefined },
            };

        const params = {
            device,
            path: addressPath,
            unlockPath: account.unlockPath,
            useEmptyPassphrase: device.useEmptyPassphrase,
            coin: account.symbol,
            chunkify,
        };

        let response;

        switch (account.networkType) {
            case 'ethereum':
                response = await TrezorConnect.ethereumGetAddress(params);
                break;
            case 'cardano':
                response = TrezorConnect.cardanoGetAddress({
                    device,
                    useEmptyPassphrase: device.useEmptyPassphrase,
                    addressParameters: {
                        stakingPath: getStakingPath(account),
                        addressType: getAddressType(),
                        path: addressPath,
                    },
                    protocolMagic: getProtocolMagic(account.symbol),
                    networkId: getNetworkId(account.symbol),
                    derivationType: getDerivationType(account.accountType),
                    chunkify,
                });
                break;
            case 'ripple':
                response = TrezorConnect.rippleGetAddress(params);
                break;
            case 'bitcoin':
                response = TrezorConnect.getAddress(params);
                break;
            default:
                response = {
                    success: false,
                    payload: { error: 'Method for getAddress not defined', code: undefined },
                };
        }
        return response;
    },
);
