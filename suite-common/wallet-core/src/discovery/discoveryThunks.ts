import { createThunk } from '@suite-common/redux-utils';
import { AcquiredDevice, AuthorizedDevice, TrezorDevice } from '@suite-common/suite-types';
import { getNewInstanceNumber } from '@suite-common/suite-utils';
import { Bip43Path, TrezorConnectBackendType } from '@suite-common/wallet-config';
import { DiscoveryStatus, FailedAccount } from '@suite-common/wallet-types';
import TrezorConnect, {
    BundleProgress,
    DeviceState,
    DeviceUniquePath,
    StaticSessionId,
    UI,
} from '@trezor/connect';
import {
    DiscoverAccountsProgress,
    DiscoverAccountsProgressOk,
} from '@trezor/connect/src/types/api/discoverAccounts';

import { DISCOVERY_MODULE_PREFIX, discoveryActions } from './discoveryActions';
import {
    isDiscoveryInProgress,
    selectDiscovery,
    selectDiscoveryByDevicePath,
} from './discoverySelectors';
import { CreateAccountActionProps, accountsActions } from '../accounts/accountsActions';
import { deviceActions } from '../device/deviceActions';
import {
    selectDeviceByStaticSessionId,
    selectDevices,
    selectPhysicalDevices,
    selectSelectedDevice,
} from '../device/deviceSelectors';
import { selectDeviceThunk } from '../device/deviceThunks';
import {
    selectAccountsToBeForgotten,
    selectIsRediscoverNeeded,
    selectNetworksToDiscover,
} from '../selectors';
import { selectEnabledNetworks } from '../settings/walletSettingsReducer';

const USER_UI_CANCEL_CODE = 'USER_UI_CANCEL';
const DEVICE_CANCELLATION_CODES = ['Method_Cancel', 'Failure_ActionCancelled'];
const EXPECTED_CANCELLATION_CODES = [USER_UI_CANCEL_CODE, ...DEVICE_CANCELLATION_CODES];

type ProgressEvent = BundleProgress<DiscoverAccountsProgress>['payload'];
type ProgressOkEvent = BundleProgress<DiscoverAccountsProgressOk>['payload'];
const isProgressOk = (progress: DiscoverAccountsProgress): progress is DiscoverAccountsProgressOk =>
    Object.prototype.hasOwnProperty.call(progress, 'path');
const isProgressEventOk = (progressEvent: ProgressEvent): progressEvent is ProgressOkEvent =>
    isProgressOk(progressEvent.response);

function assertDeviceIsAuthorized(device?: TrezorDevice): asserts device is AuthorizedDevice {
    if (!device?.state?.staticSessionId) {
        throw new Error('assertion error: device is not authorized');
    }
}

function assertDeviceIsAcquired(device?: TrezorDevice): asserts device is AcquiredDevice {
    if (!device || !device.features) {
        throw new Error('assertion error: device is not acquired');
    }
}

function assertStaticSessionId(
    deviceState: DeviceState,
): asserts deviceState is DeviceState & { staticSessionId: StaticSessionId } {
    if (!deviceState.staticSessionId) {
        throw new Error('assertion error: device state does not contain static session id');
    }
}

const canDiscoveryContinue = (discovery?: DiscoveryStatus) => {
    if (!discovery) {
        console.warn('no discovery found, stopping');

        return false;
    }

    if (!isDiscoveryInProgress(discovery)) {
        console.warn('discovery not in progress, stopping');

        return false;
    }

    return true;
};

/**
 * If metadata are enabled in settings but metadata master key does not exist for this device state,
 * try to generate device metadata master key
 */
const initNewDeviceStateMetadataThunk = createThunk(
    `${DISCOVERY_MODULE_PREFIX}/initNewDeviceStateMetadataThunk`,
    async (staticSessionId: StaticSessionId, { getState, dispatch, extra }) => {
        const isMetadataEnabled = extra.selectors.selectMetadata(getState()).enabled;
        const device = selectDeviceByStaticSessionId(getState(), staticSessionId);
        const metadataPresentOnDevice = device?.metadata[1];
        if (isMetadataEnabled && !metadataPresentOnDevice) {
            await dispatch(extra.thunks.initMetadata(false));
        }
    },
);

const applyDeviceStatesThunk = createThunk(
    `${DISCOVERY_MODULE_PREFIX}/applyDeviceStates`,
    async (
        {
            isAddingHiddenWallet,
            newDeviceState,
            devicePath,
        }: {
            isAddingHiddenWallet?: boolean;
            newDeviceState: DeviceState;
            devicePath: DeviceUniquePath;
        },
        { dispatch, getState },
    ) => {
        try {
            const devices = selectDevices(getState());
            const devicesByPath = devices.filter(d => d.path === devicePath);

            // sanity check that there is no 2 devices sharing the same path. this shouldn't happen, the only way that comes to my mind
            // is when you would create a copy of device and store it in redux before authorizing it (this is actually the old way of doing things)
            // todo: this sanity check could be moved somewhere higher.
            // if (devicesByPath.length !== 1) {
            //     throw new Error('exactly one device should be found by path');
            // }
            const device = devicesByPath[0];

            assertDeviceIsAcquired(device);
            assertStaticSessionId(newDeviceState);

            const physicalDevices = selectPhysicalDevices(getState());
            const devicesWithoutState = physicalDevices.filter(d => !d.state?.staticSessionId);

            // now we expect that there is exactly one device without state - meaning that we want to update its state
            if (devicesWithoutState.length === 1) {
                dispatch(
                    deviceActions.setDeviceState({
                        device,
                        state: newDeviceState,
                        useEmptyPassphrase: !isAddingHiddenWallet,
                    }),
                );
            } else {
                dispatch(
                    deviceActions.addAuthorizedDevice({
                        device: {
                            ...device,
                            metadata: {},
                            instance: getNewInstanceNumber(selectDevices(getState()), device),
                            useEmptyPassphrase: !isAddingHiddenWallet,
                            state: newDeviceState,
                        },
                    }),
                );

                // todo: there is probably more efficient way to select device after it was created
                const newlyAddedDevice = selectDeviceByStaticSessionId(
                    getState(),
                    newDeviceState.staticSessionId,
                );
                if (!newlyAddedDevice) return;
                dispatch(selectDeviceThunk({ device: newlyAddedDevice }));
            }

            const { staticSessionId } = newDeviceState;
            await dispatch(initNewDeviceStateMetadataThunk(staticSessionId));
        } catch (error) {
            console.warn('applyDeviceStatesThunk error', error);
        }
    },
);

const createOnBundleProgressHandler = (
    devicePath: DeviceUniquePath,
    deviceStaticSessionId: StaticSessionId,
    dispatch: any,
    getState: any,
) => {
    let encounteredNonEmptyAccount = false;
    // we do not create empty accounts right away, but store the progress events for later
    const emptyProgressEvents: ProgressOkEvent[] = [];

    const progressEventToCreateAccountPayload = (
        event: ProgressOkEvent,
    ): CreateAccountActionProps => {
        const { response } = event;
        const backendType = response.backendType as TrezorConnectBackendType | undefined;

        return {
            deviceState: deviceStaticSessionId,
            discoveryItem: {
                path: response.path as Bip43Path,
                coin: response.symbol,
                index: response.index,
                accountType: response.type,
                backendType,
            },
            accountInfo: response,
            // first normal account is always visible on web & desktop
            visible: (response.type === 'normal' && response.index === 0) || !response.empty,
        };
    };

    return (event: ProgressEvent) => {
        console.warn('bundle progress handler', event);
        const discovery = selectDiscoveryByDevicePath(getState(), devicePath);
        if (!discovery) {
            console.warn('bundle progress handler: no discovery found');

            return;
        }

        dispatch(
            discoveryActions.updateDiscovery(
                {
                    status: 'progress',
                    total: event.total,
                    progress: event.progress,
                },
                devicePath,
            ),
        );

        if (isProgressEventOk(event)) {
            // all encountered accounts were empty, so create all of the delayed empty accounts (and also the latest event)
            if (event.progress === 100 && !encounteredNonEmptyAccount) {
                [...emptyProgressEvents, event].forEach(delayedEvent => {
                    dispatch(
                        accountsActions.createAccount(
                            progressEventToCreateAccountPayload(delayedEvent),
                        ),
                    );
                });

                return;
            }

            if (encounteredNonEmptyAccount) {
                dispatch(accountsActions.createAccount(progressEventToCreateAccountPayload(event)));

                return;
            } else {
                emptyProgressEvents.push(event);
            }

            // on first non-empty one, create all of the delayed empty accounts
            if (!encounteredNonEmptyAccount && event.response.empty === false) {
                encounteredNonEmptyAccount = true;

                emptyProgressEvents.forEach(delayedEvent => {
                    dispatch(
                        accountsActions.createAccount(
                            progressEventToCreateAccountPayload(delayedEvent),
                        ),
                    );
                });
            }

            return;
        }

        const { response } = event;
        if (isProgressOk(response)) {
            console.error('Cannot happen per TS; event.response cannot be OK if event is not OK');

            return;
        }
        console.warn(`bundle progress error handler: ${response.error}`);
        const currentFailedAccounts = discovery.failed ?? [];
        const newFailedAccount: FailedAccount = { accountType: response.type, ...response };

        const { symbol, accountType, index } = newFailedAccount;
        const isDuplicate = currentFailedAccounts.some(
            f => f.symbol === symbol && f.accountType === accountType && f.index === index,
        );
        if (isDuplicate) return; // only defensive programming

        dispatch(
            discoveryActions.updateDiscovery(
                { ...discovery, failed: [...currentFailedAccounts, newFailedAccount] },
                devicePath,
            ),
        );
    };
};

const completeDiscoveryThunk = createThunk(
    `${DISCOVERY_MODULE_PREFIX}/complete`,
    (
        {
            staticSessionId,
            devicePath,
        }: {
            staticSessionId: StaticSessionId;
            devicePath: DeviceUniquePath;
        },
        { dispatch, extra },
    ) => {
        dispatch(
            discoveryActions.updateDiscovery(
                {
                    status: 'complete',
                },
                devicePath,
            ),
        );

        dispatch(extra.thunks.fetchAndSaveMetadata(staticSessionId));
    },
);

export const runDiscoveryThunk = createThunk(
    `${DISCOVERY_MODULE_PREFIX}/run`,
    async (passedDevice: TrezorDevice, { dispatch, getState }): Promise<void> => {
        try {
            // eslint-disable-next-line no-console
            console.time('runDiscovery start');
            let device = passedDevice;

            const discovery = selectDiscoveryByDevicePath(getState(), device.path);

            if (!canDiscoveryContinue(discovery) || !discovery) {
                console.warn('no discovery found, stopping');

                return;
            }

            const { isAddingHiddenWallet } = discovery;

            if (!device) {
                console.warn('no device');

                return;
            }

            if (isAddingHiddenWallet && device.features && !device.features.passphrase_protection) {
                dispatch(
                    discoveryActions.updateDiscovery(
                        {
                            status: 'passphrase-enable-on-device',
                        },
                        device.path,
                    ),
                );
                const response = await TrezorConnect.applySettings({
                    device,
                    use_passphrase: true,
                });

                console.warn('TrezorConnect.applySettings', response);

                if (!response.success) {
                    dispatch(
                        discoveryActions.updateDiscovery(
                            {
                                status: 'cancelled',
                            },
                            device.path,
                        ),
                    );

                    return;
                }
            }

            if (isAddingHiddenWallet) {
                dispatch(
                    discoveryActions.updateDiscovery(
                        {
                            status: 'enter-passphrase',
                        },
                        device.path,
                    ),
                );
            }

            const instance = !device?.state
                ? device.instance
                : getNewInstanceNumber(selectDevices(getState()), device);

            const deviceStateResponse = await TrezorConnect.getDeviceState({
                device: {
                    path: device.path,
                    instance,
                    state: undefined,
                },
                useEmptyPassphrase: !isAddingHiddenWallet,
            });

            console.warn('deviceStateResponse', deviceStateResponse);

            if (!canDiscoveryContinue(selectDiscoveryByDevicePath(getState(), device.path))) {
                console.warn('no discovery found, stopping');

                return;
            }

            if (!deviceStateResponse.success) {
                const { error, code } = deviceStateResponse.payload;
                console.warn('==========');
                console.warn('error', error);
                console.warn('code', code);

                if (USER_UI_CANCEL_CODE === error) {
                    // NOTE: the discovery must be in cancelled state here
                    // addd a runtime check?
                    console.warn(
                        'startDiscoveryThunk: TrezorConnect.getDeviceState (1) cancelled by user click, discovery in cancelled state',
                    );

                    return;
                }

                // NOTE: mark the discovery as failed if the error is not a user cancellation cancellation
                if (
                    !EXPECTED_CANCELLATION_CODES.includes(String(deviceStateResponse.payload.code))
                ) {
                    dispatch(
                        discoveryActions.updateDiscovery(
                            {
                                status: 'failed',
                                failed: [], // no failed accounts yet,
                                error: deviceStateResponse.payload.error,
                                errorCode: deviceStateResponse.payload.code,
                            },
                            device.path,
                        ),
                    );
                }

                if (DEVICE_CANCELLATION_CODES.includes(String(deviceStateResponse.payload.code))) {
                    const cancelledDiscovery = selectDiscovery(getState())?.[device.path];

                    // NOTE: the device might trigger cancellation
                    if (cancelledDiscovery && cancelledDiscovery.status !== 'cancelled') {
                        dispatch(
                            discoveryActions.updateDiscovery(
                                {
                                    status: 'cancelled',
                                },
                                device.path,
                            ),
                        );
                    }

                    console.warn(
                        'startDiscoveryThunk: TrezorConnect.getDeviceState (1) cancelled by user with code: ',
                        deviceStateResponse.payload.code,
                    );
                }

                return;
            }

            if (!isAddingHiddenWallet) {
                await dispatch(
                    applyDeviceStatesThunk({
                        newDeviceState: deviceStateResponse.payload._state,
                        isAddingHiddenWallet,
                        devicePath: passedDevice.path,
                    }),
                );
            }

            // @ts-expect-error todo:
            device = selectSelectedDevice(getState());

            assertStaticSessionId(deviceStateResponse.payload._state);
            const onBundleProgress = createOnBundleProgressHandler(
                device.path,
                deviceStateResponse.payload._state.staticSessionId,
                dispatch,
                getState,
            );

            TrezorConnect.on<DiscoverAccountsProgress>(UI.BUNDLE_PROGRESS, onBundleProgress);

            const enabledNetworks = selectEnabledNetworks(getState());
            const discoveryAccountsPayload = enabledNetworks.map(n => ({ symbol: n }));
            console.warn('discoveryAccountsPayload', discoveryAccountsPayload);

            if (!discoveryAccountsPayload.length) {
                console.warn('no networks to discover, todo: stop discovery');
                // todo: stop discovery;
            }

            const result = await TrezorConnect.discoverAccounts({
                device: {
                    instance,
                    state: {
                        staticSessionId: deviceStateResponse.payload._state.staticSessionId,
                    },
                },
                useEmptyPassphrase: !isAddingHiddenWallet,
                accounts: discoveryAccountsPayload,
            });
            console.warn('startDiscoveryThunk: TrezorConnect.getAccountInfo, result: ', result);

            TrezorConnect.off(UI.BUNDLE_PROGRESS, onBundleProgress);

            if (!canDiscoveryContinue(selectDiscoveryByDevicePath(getState(), device.path))) {
                console.warn('no discovery found, stopping');

                return;
            }

            if (!result.success) {
                dispatch(
                    discoveryActions.updateDiscovery(
                        {
                            status: 'failed',
                            error: result.payload.error,
                            errorCode: result.payload.code,
                        },
                        device.path,
                    ),
                );

                return;
            }

            assertStaticSessionId(deviceStateResponse.payload._state);

            if (!isAddingHiddenWallet) {
                console.warn('startDiscoveryThunk: adding standard wallet, ending here');

                dispatch(
                    completeDiscoveryThunk({
                        staticSessionId: deviceStateResponse.payload._state.staticSessionId,
                        devicePath: device.path,
                    }),
                );

                return;
            }

            if (!deviceStateResponse.payload._state.staticSessionId) {
                // this shouldn't happen I think
                console.warn('no static session id in device state response');

                return;
            }

            const duplicate = selectDevices(getState())
                .filter(d => d.state?.staticSessionId)
                .find(
                    d =>
                        d.state!.staticSessionId!.split(':')[0] ===
                        deviceStateResponse.payload._state.staticSessionId!.split(':')[0],
                );

            if (duplicate) {
                console.warn('duplicate passphrase detected', deviceStateResponse);

                dispatch(
                    discoveryActions.updateDiscovery(
                        {
                            status: 'passphrase-duplicate',
                            duplicateDeviceStaticSessionId:
                                deviceStateResponse.payload._state.staticSessionId,
                        },
                        device.path,
                    ),
                );

                return;
            }

            // @ts-expect-error todo:
            device = selectSelectedDevice(getState());

            const allAccountsEmpty = result.payload.nonempty === 0;
            // there is at least one account with balance - passphrase is not empty
            console.warn('allAccountsEmpty', allAccountsEmpty);

            if (!allAccountsEmpty) {
                await dispatch(
                    applyDeviceStatesThunk({
                        newDeviceState: deviceStateResponse.payload._state,
                        isAddingHiddenWallet,
                        devicePath: device.path,
                    }),
                );

                dispatch(
                    completeDiscoveryThunk({
                        staticSessionId: deviceStateResponse.payload._state.staticSessionId,
                        devicePath: device.path,
                    }),
                );

                console.warn(
                    'startDiscoveryThunk: passphrase discovery -> passphrase is not empty, finished',
                );

                return;
            }

            if (!device) {
                console.warn('no device in discovery thunk');

                return;
            }

            if (!selectDiscovery(getState())?.[device.path]) {
                console.warn('no discovery found, stopping');

                return;
            }

            dispatch(
                discoveryActions.updateDiscovery(
                    {
                        status: 'confirm-empty-passphrase',
                        emptyWallet: true,
                    },
                    device.path,
                ),
            );
            console.warn('GET DEVICE STATE 2: SENDING INSTANCE NUMBER', instance);

            const getDeviceState2Res = await TrezorConnect.getDeviceState({
                device: {
                    path: device.path,
                    instance,
                    state: undefined,
                },
                useEmptyPassphrase: false,
            });
            console.warn('getDeviceState2Res', getDeviceState2Res);

            if (!canDiscoveryContinue(selectDiscoveryByDevicePath(getState(), device.path))) {
                console.warn('no discovery found, stopping');

                return;
            }

            if (!getDeviceState2Res.success) {
                // error, device disconnected, whatever, todo: handle

                if (USER_UI_CANCEL_CODE === getDeviceState2Res.payload.error) {
                    // NOTE: the discovery must be in cancelled state here
                    // addd a runtime check?
                    console.warn(
                        'startDiscoveryThunk: TrezorConnect.getDeviceState (1) cancelled by user click, discovery in cancelled state',
                    );

                    return;
                }
                // NOTE ERROR HANDLING COPIED FROM ABOVE, NEEDS TO BE PROPERLY REUSED!

                // NOTE: mark the discovery as failed if the error is not a user cancellation cancellation
                if (
                    !EXPECTED_CANCELLATION_CODES.includes(String(getDeviceState2Res.payload.code))
                ) {
                    dispatch(
                        discoveryActions.updateDiscovery(
                            {
                                status: 'failed',
                                failed: [], // no failed accounts yet,
                                error: getDeviceState2Res.payload.error,
                                errorCode: getDeviceState2Res.payload.code,
                            },
                            device.path,
                        ),
                    );
                }

                if (DEVICE_CANCELLATION_CODES.includes(String(getDeviceState2Res.payload.code))) {
                    const cancelledDiscovery = selectDiscovery(getState())?.[device.path];

                    // NOTE: the device might trigger cancellation
                    if (cancelledDiscovery && cancelledDiscovery.status !== 'cancelled') {
                        dispatch(
                            discoveryActions.updateDiscovery(
                                {
                                    status: 'cancelled',
                                },
                                device.path,
                            ),
                        );
                    }

                    console.warn(
                        'startDiscoveryThunk: TrezorConnect.getDeviceState (1) cancelled by user with code: ',
                        getDeviceState2Res.payload.code,
                    );
                }

                // at this point it can only be USER_UI_CANCEL_CODE
                return;
            }

            if (
                // todo: not sure about instance, now it looks that there are 2 devices created in connect
                getDeviceState2Res.payload._state.staticSessionId?.split(':')[0] !==
                deviceStateResponse.payload._state.staticSessionId?.split(':')[0]
            ) {
                console.warn(
                    'device state does not match -> different passphrase entered second time',
                );
                dispatch(
                    discoveryActions.updateDiscovery(
                        {
                            status: 'passphrase-mismatch',
                        },
                        device.path,
                    ),
                );

                return;
            }

            await dispatch(
                applyDeviceStatesThunk({
                    newDeviceState: deviceStateResponse.payload._state,
                    isAddingHiddenWallet,
                    devicePath: passedDevice.path,
                }),
            );

            dispatch(
                completeDiscoveryThunk({
                    staticSessionId: deviceStateResponse.payload._state.staticSessionId,
                    devicePath: device.path,
                }),
            );
        } catch (error) {
            // todo: cleanup, probably set discovery to failed
            console.warn('runDiscovery error', error);
        } finally {
            // eslint-disable-next-line no-console
            console.timeEnd('runDiscovery start');
        }
    },
);

export const startDiscoveryThunk = createThunk(
    `${DISCOVERY_MODULE_PREFIX}/start`,
    (
        {
            device,
            isAddingHiddenWallet,
            isAddingExistingWallet,
        }: {
            device?: TrezorDevice;
            isAddingHiddenWallet?: boolean;
            isAddingExistingWallet?: boolean;
        },
        { dispatch, getState },
    ): void => {
        const selectedDevice = selectSelectedDevice(getState());

        const actualDevice = device ?? selectedDevice;

        if (!actualDevice) {
            console.warn('startDiscoveryThunk: no device found');

            return;
        }

        const currentDiscovery = selectDiscoveryByDevicePath(getState(), actualDevice.path);

        if (isDiscoveryInProgress(currentDiscovery)) {
            console.warn(
                'startDiscoveryThunk: discovery already in progress, cancelling start call',
            );

            return;
        }

        dispatch(
            discoveryActions.startDiscovery(
                actualDevice.path,
                isAddingHiddenWallet,
                isAddingExistingWallet,
            ),
        );

        // NOTE: run the discovery only if
        // - we are adding a standard wallet,
        // - or adding an existing hidden wallet,
        // -
        if (!isAddingHiddenWallet || (isAddingHiddenWallet && isAddingExistingWallet)) {
            dispatch(runDiscoveryThunk(actualDevice));
        }
    },
);

export const runAdditionalDiscoveryThunk = createThunk(
    `${DISCOVERY_MODULE_PREFIX}/runAdditional`,
    async (staticSessionId: StaticSessionId, { dispatch, getState }): Promise<void> => {
        // todo: not now, but in the future, there could be more devices (wallets) sharing the same static session id, for example
        // an imported wallet + wallet on the physical device. So this should run for all the applicable devices/wallets

        const device = selectDeviceByStaticSessionId(getState(), staticSessionId);

        assertDeviceIsAuthorized(device);

        const accountsToRemove = selectAccountsToBeForgotten(getState());
        if (accountsToRemove.length > 0) {
            dispatch(accountsActions.removeAccount(accountsToRemove));
        }

        const isRediscoverNeeded = selectIsRediscoverNeeded(
            getState(),
            device.state.staticSessionId,
        );

        if (!isRediscoverNeeded) {
            console.warn('no rediscovery needed');

            return;
        }
        dispatch(discoveryActions.startDiscovery(device.path, false, false));

        const onBundleProgress = createOnBundleProgressHandler(
            device.path,
            device.state.staticSessionId,
            dispatch,
            getState,
        );

        const networksToDiscover = selectNetworksToDiscover(
            getState(),
            device.state.staticSessionId,
        );

        if (networksToDiscover.length === 0) {
            console.warn('no networks to discover');

            return;
        }

        TrezorConnect.on<DiscoverAccountsProgress>(UI.BUNDLE_PROGRESS, onBundleProgress);

        const result = await TrezorConnect.discoverAccounts({
            device,
            useEmptyPassphrase: device.useEmptyPassphrase,
            accounts: networksToDiscover.map(n => ({
                symbol: n,
            })),
        });

        console.warn('runAdditionalDiscovery: TrezorConnect.getAccountInfo, result: ', result);

        TrezorConnect.off(UI.BUNDLE_PROGRESS, onBundleProgress);

        if (!result.success) {
            dispatch(
                discoveryActions.updateDiscovery(
                    {
                        status: 'failed',
                        error: result.payload.error,
                        errorCode: result.payload.code,
                    },
                    device.path,
                ),
            );

            return;
        }

        dispatch(discoveryActions.updateDiscovery({ status: 'complete' }, device.path));
    },
);

export const submitPassphrase = createThunk(
    `${DISCOVERY_MODULE_PREFIX}/submitPassphrase`,
    (
        {
            device,
            passphrase,
            passphraseOnDevice,
        }: {
            device: TrezorDevice;
            passphrase: string;
            passphraseOnDevice?: boolean;
        },
        { dispatch },
    ) => {
        dispatch(
            discoveryActions.updateDiscovery(
                {
                    status: 'progress',
                    progress: 0, // dummy value, otherwise it comes in progress event from trezor-connect
                    total: 100,
                    passphraseOnDevice,
                },
                device.path,
            ),
        );

        TrezorConnect.uiResponse({
            type: UI.RECEIVE_PASSPHRASE,
            payload: {
                value: passphrase,
                save: true,
                passphraseOnDevice,
            },
        });
    },
);

export const cancelDiscoveryThunk = createThunk(
    `${DISCOVERY_MODULE_PREFIX}/cancel`,
    (device: TrezorDevice, { dispatch }) => {
        TrezorConnect.cancel(USER_UI_CANCEL_CODE);

        dispatch(discoveryActions.deleteDiscovery(device.path));
    },
);

/**
 * Helper to restart discovery for currently selected device
 */
export const restartDiscoveryThunk = createThunk(
    `${DISCOVERY_MODULE_PREFIX}/restart`,
    (_, { dispatch, getState }) => {
        const device = selectSelectedDevice(getState());
        const staticSessionId = device?.state?.staticSessionId;
        if (staticSessionId === undefined) return;
        dispatch(runAdditionalDiscoveryThunk(staticSessionId));
    },
);
