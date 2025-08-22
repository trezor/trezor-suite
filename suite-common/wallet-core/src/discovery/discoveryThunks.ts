import { createThunk } from '@suite-common/redux-utils';
import { AcquiredDevice, AuthorizedDevice, TrezorDevice } from '@suite-common/suite-types';
import { getNewInstanceNumber } from '@suite-common/suite-utils';
import { Bip43Path, TrezorConnectBackendType } from '@suite-common/wallet-config';
import { DiscoveryItem, DiscoveryStatus } from '@suite-common/wallet-types';
import { shouldDeviceBeRemembered } from '@suite-common/wallet-utils';
import TrezorConnect, {
    AccountInfo,
    BundleProgress,
    DeviceState,
    DeviceUniquePath,
    StaticSessionId,
    UI,
} from '@trezor/connect';
import { DiscoverAccountsProgress } from '@trezor/connect/src/types/api/discoverAccounts';

import { DISCOVERY_MODULE_PREFIX, discoveryActions } from './discoveryActions';
import { isDiscoveryInProgress, selectDiscoveryByDevicePath } from './discoverySelectors';
import { CreateAccountActionProps, accountsActions } from '../accounts/accountsActions';
import { deviceActions } from '../device/deviceActions';
import {
    selectDeviceByStaticSessionId,
    selectDevices,
    selectIsDeviceAutoEjectEnabled,
    selectSelectedDevice,
    selectStandardWalletDevice,
} from '../device/deviceSelectors';
import { selectDeviceThunk } from '../device/deviceThunks';
import { selectAccountsToBeForgotten, selectDiscoveryAccountsParam } from '../selectors';

const USER_UI_CANCEL_CODE = 'USER_UI_CANCEL';
const DEVICE_CANCELLATION_CODES = ['Method_Cancel', 'Failure_ActionCancelled'];

type ProgressEvent = BundleProgress<DiscoverAccountsProgress>['payload'];

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

            const currentDeviceByStaticSessionId = newDeviceState.staticSessionId
                ? selectDeviceByStaticSessionId(getState(), newDeviceState.staticSessionId)
                : null;

            if (currentDeviceByStaticSessionId && isAddingHiddenWallet) {
                console.warn(
                    'applyDeviceStatesThunk: applying state to a device with static session id',
                );

                return;
            }

            const devicesByPathWithoutState = devicesByPath.filter(d => !d.state?.staticSessionId);
            // sanity check that there is no 2 devices sharing the same path. this shouldn't happen, the only way that comes to my mind
            // is when you would create a copy of device and store it in redux before authorizing it (this is actually the old way of doing things)
            // todo: this sanity check could be moved somewhere higher.
            if (devicesByPathWithoutState.length !== 1 && devicesByPathWithoutState.length !== 0) {
                throw new Error('there must be either one or zero physical devices without state');
            }
            const device = devicesByPath[0];

            assertDeviceIsAcquired(device);
            assertStaticSessionId(newDeviceState);
            const { staticSessionId } = newDeviceState;

            // user was adding a hidden wallet but he might have input empty passphrase -> this is defacto standard wallet
            let useEmptyPassphrase = !isAddingHiddenWallet; // set to reasonable default
            if (isAddingHiddenWallet) {
                let emptyPassphraseDeviceState = selectStandardWalletDevice(getState())?.state;

                // no cache hit, query device
                if (!emptyPassphraseDeviceState) {
                    const res = await TrezorConnect.getDeviceState({
                        device,
                        useEmptyPassphrase: true,
                    });
                    if (res.success) {
                        emptyPassphraseDeviceState = res.payload._state;
                    }

                    // todo: how to handle error?
                }

                if (emptyPassphraseDeviceState) {
                    useEmptyPassphrase =
                        emptyPassphraseDeviceState!.staticSessionId?.split(':')[0] ===
                        staticSessionId.split(':')[0];
                }
            }

            // now we expect that there is exactly one device without state - meaning that we want to update its state
            if (devicesByPathWithoutState.length === 1) {
                dispatch(
                    deviceActions.setDeviceState({
                        device,
                        state: newDeviceState,
                        useEmptyPassphrase,
                    }),
                );
            } else {
                const isDeviceAutoEjectEnabled = selectIsDeviceAutoEjectEnabled(getState());

                dispatch(
                    deviceActions.addAuthorizedDevice({
                        device: {
                            ...device,
                            metadata: {},
                            instance: getNewInstanceNumber(selectDevices(getState()), device),
                            useEmptyPassphrase,
                            remember: shouldDeviceBeRemembered({
                                isDeviceAutoEjectEnabled,
                                device,
                            }),
                            state: newDeviceState,
                        },
                    }),
                );

                // select the device after deviceReducer updates it (it's a new object reference)
                const newlyAddedDevice = selectDeviceByStaticSessionId(getState(), staticSessionId);
                if (newlyAddedDevice === undefined) return;
                dispatch(selectDeviceThunk({ device: newlyAddedDevice }));
            }

            await dispatch(initNewDeviceStateMetadataThunk(staticSessionId));
        } catch (error) {
            console.error('applyDeviceStatesThunk error', error);
        }
    },
);

const transformProgressEventData = (
    { response, progress, total }: ProgressEvent,
    deviceState: StaticSessionId,
    discovery: DiscoveryStatus,
) => {
    const { index, symbol: coin, type: accountType, path, backendType } = response;

    const discoveryItem: DiscoveryItem = {
        coin,
        index,
        accountType,
        path: path as Bip43Path,
        backendType: backendType as TrezorConnectBackendType | undefined,
    };

    const accountInfo: AccountInfo = !response.failed
        ? response
        : {
              descriptor: `failed:${index}:${coin}:${accountType}`,
              balance: '0',
              availableBalance: '0',
              empty: true,
              history: { total: 0, unconfirmed: 0 },
          };

    const accountPayload: CreateAccountActionProps = {
        deviceState,
        discoveryItem,
        accountInfo,
        // first normal account is always visible on web & desktop
        visible: response.failed || !response.empty || (accountType === 'normal' && index === 0),
        error: response.failed ? response.error : undefined,
    };

    const discoveryPayload: DiscoveryStatus = {
        status: 'progress' as const,
        progress,
        total,
        hasLoadedAnyNonEmptyAccount: discovery.hasLoadedAnyNonEmptyAccount || !accountInfo.empty,
    };

    return { accountPayload, discoveryPayload };
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

type ApplyDeviceStateErrorThunkProps = {
    error: string | undefined;
    code: string | undefined;
    devicePath: DeviceUniquePath;
};

const applyDeviceStateErrorThunk = createThunk(
    `${DISCOVERY_MODULE_PREFIX}/applyDeviceStateError`,
    ({ error, code, devicePath }: ApplyDeviceStateErrorThunkProps, { dispatch, getState }) => {
        // means that `cancelDiscoveryThunk` has been called and device returned code:Method_Cancel and this specific `error`
        if (error === USER_UI_CANCEL_CODE) return;

        if (code !== undefined && DEVICE_CANCELLATION_CODES.includes(code)) {
            const cancelledDiscovery = selectDiscoveryByDevicePath(getState(), devicePath);

            // The device itself might trigger cancellation, so we need to sync the discovery state
            if (cancelledDiscovery && cancelledDiscovery.status !== 'cancelled') {
                dispatch(discoveryActions.updateDiscovery({ status: 'cancelled' }, devicePath));
            }

            return;
        }

        // The error is not from deliberate cancellation, so we mark the discovery as failed
        dispatch(
            discoveryActions.updateDiscovery(
                { status: 'failed', error, errorCode: code },
                devicePath,
            ),
        );
    },
);

export const runDiscoveryThunk = createThunk(
    `${DISCOVERY_MODULE_PREFIX}/run`,
    async (passedDevice: TrezorDevice, { dispatch, getState }): Promise<void> => {
        try {
            let device: TrezorDevice = passedDevice;

            const reselectDevice = () => {
                const selectedDevice = selectSelectedDevice(getState());
                assertDeviceIsAcquired(selectedDevice);

                return selectedDevice;
            };

            const discovery = selectDiscoveryByDevicePath(getState(), device.path);

            if (!isDiscoveryInProgress(discovery)) return;

            const { isAddingHiddenWallet } = discovery;

            assertDeviceIsAcquired(device);
            if (isAddingHiddenWallet && device.features && !device.features.passphrase_protection) {
                dispatch(
                    discoveryActions.updateDiscovery(
                        { status: 'passphrase-enable-on-device' },
                        device.path,
                    ),
                );
                const response = await TrezorConnect.applySettings({
                    device,
                    use_passphrase: true,
                });

                if (!response.success) {
                    dispatch(
                        discoveryActions.updateDiscovery({ status: 'cancelled' }, device.path),
                    );

                    return;
                }
            }

            if (isAddingHiddenWallet) {
                dispatch(
                    discoveryActions.updateDiscovery({ status: 'enter-passphrase' }, device.path),
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

            if (!isDiscoveryInProgress(selectDiscoveryByDevicePath(getState(), device.path))) {
                return;
            }

            if (!deviceStateResponse.success) {
                const { error, code } = deviceStateResponse.payload;
                dispatch(applyDeviceStateErrorThunk({ error, code, devicePath: device.path }));

                return;
            }

            const deviceState = deviceStateResponse.payload._state;

            assertStaticSessionId(deviceState);

            if (!isAddingHiddenWallet) {
                await dispatch(
                    applyDeviceStatesThunk({
                        newDeviceState: deviceState,
                        isAddingHiddenWallet,
                        devicePath: passedDevice.path,
                    }),
                );
            }

            device = reselectDevice();

            const duplicate = selectDevices(getState())
                .filter(d => d.state?.staticSessionId)
                .find(
                    d =>
                        d.state!.staticSessionId!.split(':')[0] ===
                        deviceState.staticSessionId!.split(':')[0],
                );

            if (isAddingHiddenWallet && duplicate?.state?.staticSessionId) {
                dispatch(
                    discoveryActions.updateDiscovery(
                        {
                            status: 'passphrase-duplicate',
                            duplicateDeviceStaticSessionId: duplicate.state.staticSessionId,
                        },
                        device.path,
                    ),
                );

                return;
            }

            const accountsParam = selectDiscoveryAccountsParam(
                getState(),
                deviceState.staticSessionId,
            );

            // no networks to discover, complete discovery
            if (!accountsParam.length) {
                // TODO: find out how to early return discovery; calling completeDiscoveryThunk does not work
                console.warn('No networks to discover, todo: stop discovery');
            }

            // we do not create empty accounts right away, but store the progress events for later
            const accountQueue: CreateAccountActionProps[] = [];
            const onBundleProgress = (event: ProgressEvent) => {
                const currentDiscovery = selectDiscoveryByDevicePath(getState(), device.path);
                if (!currentDiscovery) {
                    return console.error('bundle progress handler: no discovery found');
                }

                const { accountPayload, discoveryPayload } = transformProgressEventData(
                    event,
                    deviceState.staticSessionId,
                    currentDiscovery,
                );

                // no non-empty account encountered and not the last event, enqueue account for postponed creation
                if (!discoveryPayload.hasLoadedAnyNonEmptyAccount && event.progress !== 100) {
                    accountQueue.push(accountPayload);
                } else {
                    // first non-empty account encountered right now or the last event, create all enqueued accounts first
                    if (!currentDiscovery.hasLoadedAnyNonEmptyAccount) {
                        if (isAddingHiddenWallet && discoveryPayload.hasLoadedAnyNonEmptyAccount) {
                            dispatch(
                                applyDeviceStatesThunk({
                                    newDeviceState: deviceState,
                                    isAddingHiddenWallet,
                                    devicePath: passedDevice.path,
                                }),
                            );
                        }

                        accountQueue.forEach(account =>
                            dispatch(accountsActions.createAccount(account)),
                        );
                        accountQueue.splice(0, accountQueue.length);
                    }
                    dispatch(accountsActions.createAccount(accountPayload));
                }

                dispatch(discoveryActions.updateDiscovery(discoveryPayload, device.path));
            };

            TrezorConnect.on<DiscoverAccountsProgress>(UI.BUNDLE_PROGRESS, onBundleProgress);

            // NOTE: sync set discovery status to progress to make sure that there aren't some hanging states
            // before asnyc onBundleProgress is called which sets progress
            dispatch(
                discoveryActions.updateDiscovery(
                    {
                        status: 'progress',
                        total: Infinity,
                        progress: 0,
                    },
                    device.path,
                ),
            );

            const result = await TrezorConnect.discoverAccounts({
                device: {
                    instance,
                    state: { staticSessionId: deviceState.staticSessionId },
                },
                useEmptyPassphrase: !isAddingHiddenWallet,
                accounts: accountsParam,
            });

            TrezorConnect.off(UI.BUNDLE_PROGRESS, onBundleProgress);

            if (!isDiscoveryInProgress(selectDiscoveryByDevicePath(getState(), device.path))) {
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

            if (!isAddingHiddenWallet) {
                dispatch(
                    completeDiscoveryThunk({
                        staticSessionId: deviceState.staticSessionId,
                        devicePath: device.path,
                    }),
                );

                return;
            }

            device = reselectDevice();

            const allAccountsEmpty = result.payload.nonempty === 0;
            // there is at least one account with balance - passphrase is not empty
            if (!allAccountsEmpty) {
                dispatch(
                    completeDiscoveryThunk({
                        staticSessionId: deviceState.staticSessionId,
                        devicePath: device.path,
                    }),
                );

                // finish here, device state was applied from bundle progress handler
                return;
            }

            if (!selectDiscoveryByDevicePath(getState(), device.path)) {
                console.error('Discovery aborted: no discovery found, stopping');

                return;
            }

            dispatch(
                discoveryActions.updateDiscovery(
                    { status: 'confirm-empty-passphrase', emptyWallet: true },
                    device.path,
                ),
            );

            const getDeviceState2Res = await TrezorConnect.getDeviceState({
                device: { path: device.path, instance, state: undefined },
                useEmptyPassphrase: false,
            });

            if (!isDiscoveryInProgress(selectDiscoveryByDevicePath(getState(), device.path))) {
                return;
            }

            if (!getDeviceState2Res.success) {
                const { error, code } = getDeviceState2Res.payload;
                dispatch(applyDeviceStateErrorThunk({ error, code, devicePath: device.path }));

                return;
            }

            if (
                // todo: not sure about instance, now it looks that there are 2 devices created in connect
                getDeviceState2Res.payload._state.staticSessionId?.split(':')[0] !==
                deviceState.staticSessionId?.split(':')[0]
            ) {
                dispatch(
                    discoveryActions.updateDiscovery(
                        { status: 'passphrase-mismatch' },
                        device.path,
                    ),
                );

                return;
            }

            await dispatch(
                applyDeviceStatesThunk({
                    newDeviceState: deviceState,
                    isAddingHiddenWallet,
                    devicePath: passedDevice.path,
                }),
            );

            dispatch(
                completeDiscoveryThunk({
                    staticSessionId: deviceState.staticSessionId,
                    devicePath: device.path,
                }),
            );
        } catch (error) {
            dispatch(
                discoveryActions.updateDiscovery({ status: 'failed', error }, passedDevice.path),
            );
        }
    },
);

export const startDiscoveryThunk = createThunk(
    `${DISCOVERY_MODULE_PREFIX}/start`,
    (
        {
            device,
            isAddingHiddenWallet,
            isAddingHiddenWalletWithRespectToSettings,
            isAddingExistingWallet,
        }: {
            device?: TrezorDevice;
            isAddingHiddenWallet?: boolean;
            isAddingHiddenWalletWithRespectToSettings?: boolean;
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
            discoveryActions.startDiscovery(actualDevice.path, {
                isAddingHiddenWallet,
                isAddingExistingWallet,
                isAddingHiddenWalletWithRespectToSettings,
            }),
        );

        // NOTE: run the discovery only if
        // - we are adding a standard wallet,
        // - or adding an existing hidden wallet,
        // - or adding initially a hidden wallet set by settings
        if (!isAddingHiddenWallet || isAddingExistingWallet) {
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

        const accountsParam = selectDiscoveryAccountsParam(getState(), staticSessionId);

        if (!accountsParam.length) {
            console.warn('no rediscovery needed');

            return;
        }

        dispatch(
            discoveryActions.startDiscovery(device.path, {
                isAddingHiddenWallet: false,
                isAddingExistingWallet: false,
                isAddingHiddenWalletWithRespectToSettings: false,
            }),
        );

        const onBundleProgress = (event: ProgressEvent) => {
            const discovery = selectDiscoveryByDevicePath(getState(), device.path);
            if (!discovery) {
                return console.error('bundle progress handler: no discovery found');
            }

            const { accountPayload, discoveryPayload } = transformProgressEventData(
                event,
                device.state.staticSessionId,
                discovery,
            );

            dispatch(accountsActions.createAccount(accountPayload));
            dispatch(discoveryActions.updateDiscovery(discoveryPayload, device.path));
        };

        TrezorConnect.on<DiscoverAccountsProgress>(UI.BUNDLE_PROGRESS, onBundleProgress);

        // NOTE: prepare the device to the corresponding state eg. insert the passphrase
        const deviceStateResponse = await TrezorConnect.getDeviceState({
            device: {
                path: device.path,
                instance: device.instance,
                state: device.state.staticSessionId,
            },
            useEmptyPassphrase: device.useEmptyPassphrase,
        });

        if (deviceStateResponse.success) {
            assertStaticSessionId(deviceStateResponse.payload._state);
            dispatch(
                deviceActions.setDeviceState({
                    device,
                    state: deviceStateResponse.payload._state,
                    useEmptyPassphrase: device.useEmptyPassphrase,
                }),
            );
        }

        // NOTE: keep here the previous device as default to prevent TS from screaming
        const updatedDevice = selectDeviceByStaticSessionId(getState(), staticSessionId) ?? device;

        const result = await TrezorConnect.discoverAccounts({
            device: updatedDevice,
            useEmptyPassphrase: updatedDevice.useEmptyPassphrase,
            accounts: accountsParam,
        });

        console.warn('runAdditionalDiscovery: TrezorConnect.getAccountInfo, result: ', result);

        TrezorConnect.off(UI.BUNDLE_PROGRESS, onBundleProgress);

        dispatch(
            discoveryActions.updateDiscovery(
                result.success
                    ? { status: 'complete' }
                    : {
                          status: 'failed',
                          error: result.payload.error,
                          errorCode: result.payload.code,
                      },
                updatedDevice.path,
            ),
        );
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
        { dispatch, getState },
    ) => {
        const currentDiscovery = selectDiscoveryByDevicePath(getState(), device.path);

        if (currentDiscovery) {
            dispatch(
                discoveryActions.updateDiscovery(
                    {
                        ...currentDiscovery,
                        passphraseSubmitted: true,
                        passphraseOnDevice,
                    },
                    device.path,
                ),
            );
        }

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
        // cancel with a custom error code so we can distinguish it from device cancellation
        TrezorConnect.cancel(USER_UI_CANCEL_CODE);

        dispatch(discoveryActions.updateDiscovery({ status: 'cancelled' }, device.path));
    },
);

/**
 * Helper to restart discovery for currently selected device
 */
export const restartDiscoveryThunk = createThunk(
    `${DISCOVERY_MODULE_PREFIX}/restart`,
    (_, { dispatch, getState }) => {
        const device = selectSelectedDevice(getState());
        if (!device) return;
        const staticSessionId = device.state?.staticSessionId;
        if (staticSessionId) {
            // we already have staticSessionId (=passphrase state), we probably failed during blockchain discovery
            dispatch(runAdditionalDiscoveryThunk(staticSessionId));
        } else {
            // if no staticSessionId available yet it means we failed sooner, for example during pin input
            dispatch(startDiscoveryThunk({ device }));
        }
    },
);

export const switchToDuplicatedWallet = createThunk(
    `${DISCOVERY_MODULE_PREFIX}/switchToDuplicatedWallet`,
    (_, { dispatch, getState }) => {
        const device = selectSelectedDevice(getState());
        if (!device) return;

        const discovery = selectDiscoveryByDevicePath(getState(), device.path);

        if (discovery?.status !== 'passphrase-duplicate') return;

        dispatch(cancelDiscoveryThunk(device));

        const duplicatedDevice = selectDeviceByStaticSessionId(
            getState(),
            discovery.duplicateDeviceStaticSessionId,
        );

        if (!duplicatedDevice) return;
        // Switch to the duplicated wallet
        dispatch(selectDeviceThunk({ device: duplicatedDevice }));
    },
);
