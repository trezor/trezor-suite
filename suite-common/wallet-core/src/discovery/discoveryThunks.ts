import { type ThunkDispatch, type UnknownAction } from '@reduxjs/toolkit';

import { type AnalyticsDep } from '@suite-common/analytics';
import {
    type DeviceRootState,
    deviceActions,
    selectDeviceByStaticSessionId,
    selectDevices,
    selectSelectedDevice,
    shouldDeviceBeRemembered,
} from '@suite-common/device';
import { selectDeviceThunk } from '@suite-common/device';
import { type FetchAndSaveMetadataDep } from '@suite-common/metadata-types';
import { type NetworksRootState, selectSupportedNetworkSymbols } from '@suite-common/networks';
import {
    type PersistentDeviceDataRootState,
    type ProcessDiscoveryEntropyCheckThunkDeps,
    processDiscoveryEntropyCheckThunk,
    selectEntropyCheckResultByDeviceId,
} from '@suite-common/persistent-device-data';
import {
    type AcquiredDevice,
    type AuthorizedDevice,
    type TrezorDevice,
    type TrezorDeviceWithState,
} from '@suite-common/suite-types';
import { getNewInstanceNumber } from '@suite-common/suite-utils';
import { type TokenDefinitionsRootState } from '@suite-common/token-definitions';
import { type TrezorConnectBackendType, asNetworkSymbol } from '@suite-common/wallet-config';
import {
    type DiscoveryOutcome,
    type DiscoveryStatus,
    type DiscoveryTrigger,
    type GetTradedAccountKeysDep,
} from '@suite-common/wallet-types';
import TrezorConnect, {
    type AccountInfo,
    type DeviceState,
    type DeviceUniquePath,
    type StaticSessionId,
    UI_EVENTS,
    UI_RESPONSE,
    type UiEventBundleProgress,
    type UiEventDiscoveryEntropyCheck,
} from '@trezor/connect';
import { type DiscoverAccountsProgress } from '@trezor/connect-common/src/types/api/account/discoverAccounts';
import type { Bip43Path } from '@trezor/crypto-utils';
import { type SuiteCompatibleThunk, type WithServices, createThunk } from '@trezor/redux-utils';

import { DISCOVERY_MODULE_PREFIX, discoveryActions } from './discoveryActions';
import { isDiscoveryInProgress, selectDiscoveryByDevicePath } from './discoverySelectors';
import {
    type UpdateDiscoveryThunkDeps,
    type UpdateDiscoveryThunkState,
    updateDiscoveryThunk,
} from './discoveryStateThunks';
import {
    describesSameWallet,
    findDuplicateWallet,
    getErrorCode,
    hasDiscoveryEnded,
    shouldFetchAssetsAfterDiscovery,
} from './discoveryUtils';
import { type CreateAccountActionProps, accountsActions } from '../accounts/accountsActions';
import { selectAccountsByDeviceState } from '../accounts/accountsSelectors';
import {
    fetchAndUpdateAccountThunk,
    reportAccountInfoThunk,
    reportWalletBalanceThunk,
} from '../accounts/accountsThunks';
import {
    type WalletCoreCompoundRootState,
    selectAccountsToBeForgotten,
    selectDiscoveryAccountsParam,
} from '../selectors';
import {
    type WalletSettingsRootState,
    selectIsDeviceAutoEjectEnabled,
} from '../settings/walletSettingsReducer';

const USER_UI_CANCEL_CODE = 'USER_UI_CANCEL';
const DEVICE_CANCELLATION_CODES = ['Method_Cancel', 'Failure_ActionCancelled'];

type DiscoveryReportingThunkState = TokenDefinitionsRootState &
    WalletCoreCompoundRootState &
    NetworksRootState &
    PersistentDeviceDataRootState;
type DiscoveryReportingDeps = WithServices<AnalyticsDep & GetTradedAccountKeysDep>;

type ProgressEvent = UiEventBundleProgress<DiscoverAccountsProgress>['payload'];

type DiscoveryEntropyCheckEvent = UiEventDiscoveryEntropyCheck['payload'];

function assertDeviceIsAuthorized(device?: TrezorDevice): asserts device is AuthorizedDevice {
    if (!device?.state?.staticSessionId) {
        throw new Error('assertion error: device is not authorized');
    }
}

function assertDeviceIsAcquired(device?: TrezorDevice): asserts device is AcquiredDevice {
    if (!device?.features) {
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

type ApplyDeviceStatesThunkState = DeviceRootState & WalletSettingsRootState;

export const applyDeviceStatesThunk = createThunk<
    { device: TrezorDevice },
    {
        isAddingHiddenWallet?: boolean;
        newDeviceState: DeviceState;
        devicePath: DeviceUniquePath;
    },
    {
        rejectValue: string;
        state: ApplyDeviceStatesThunkState;
    }
>(
    `${DISCOVERY_MODULE_PREFIX}/applyDeviceStates`,
    (
        { isAddingHiddenWallet, newDeviceState, devicePath },
        { dispatch, getState, fulfillWithValue, rejectWithValue },
    ) => {
        try {
            const currentDeviceByStaticSessionId = newDeviceState.staticSessionId
                ? selectDeviceByStaticSessionId(getState(), newDeviceState.staticSessionId)
                : null;

            if (currentDeviceByStaticSessionId && isAddingHiddenWallet) {
                return rejectWithValue(
                    'applyDeviceStatesThunk: applying state to a device with static session id',
                );
            }

            const devices = selectDevices(getState());
            const devicesByPath = devices.filter(d => d.path === devicePath);
            const devicesByPathWithoutState = devicesByPath.filter(d => !d.state?.staticSessionId);
            // sanity check that there is no 2 devices sharing the same path. this shouldn't happen, the only way that comes to my mind
            // is when you would create a copy of device and store it in redux before authorizing it (this is actually the old way of doing things)
            // todo: this sanity check could be moved somewhere higher.
            if (devicesByPathWithoutState.length > 1) {
                return rejectWithValue(
                    'there must be either one or zero physical devices without state',
                );
            }
            const device = devicesByPathWithoutState[0] ?? devicesByPath[0];

            assertDeviceIsAcquired(device);
            assertStaticSessionId(newDeviceState);
            const { staticSessionId } = newDeviceState;

            const useEmptyPassphrase = !isAddingHiddenWallet;

            // now we expect that there is exactly one device without state - meaning that we want to update its state
            const isAutoEjectEnabled = selectIsDeviceAutoEjectEnabled(getState());
            const remember = shouldDeviceBeRemembered({ isAutoEjectEnabled, device });

            if (devicesByPathWithoutState.length === 1) {
                dispatch(
                    deviceActions.setDeviceState({
                        device,
                        state: newDeviceState,
                        useEmptyPassphrase,
                    }),
                );

                // select the device after deviceReducer updates it (it's a new object reference)
                const newlyAddedDevice = selectDeviceByStaticSessionId(getState(), staticSessionId);
                if (newlyAddedDevice === undefined) {
                    return rejectWithValue('applyDeviceStatesThunk: newly added device not found');
                }
                dispatch(deviceActions.setRememberDevice({ device: newlyAddedDevice, remember }));

                return fulfillWithValue({ device: newlyAddedDevice });
            } else {
                dispatch(
                    deviceActions.addAuthorizedDevice({
                        device,
                        state: newDeviceState,
                        useEmptyPassphrase,
                    }),
                );

                // `device` is another wallet of the same physical device, so find the added one by its static session id.
                const newlyAddedDevice = selectDeviceByStaticSessionId(getState(), staticSessionId);
                if (newlyAddedDevice === undefined) {
                    return rejectWithValue('applyDeviceStatesThunk: newly added device not found');
                }
                dispatch(deviceActions.setRememberDevice({ device: newlyAddedDevice, remember }));
                dispatch(selectDeviceThunk({ device: newlyAddedDevice }));

                return fulfillWithValue({ device: newlyAddedDevice });
            }
        } catch (error) {
            console.error('applyDeviceStatesThunk error', error);

            return rejectWithValue(error);
        }
    },
);

const transformProgressEventData = (
    { response, progress, total }: ProgressEvent,
    deviceState: StaticSessionId,
    discovery: DiscoveryStatus,
) => {
    const { index, symbol, type: accountType, path, backendType } = response;

    const accountInfo: AccountInfo = !response.failed
        ? response
        : {
              descriptor: `failed:${index}:${symbol}:${accountType}`,
              balance: '0',
              availableBalance: '0',
              empty: true,
              history: { total: 0, unconfirmed: 0 },
          };

    const accountPayload: CreateAccountActionProps = {
        deviceState,
        symbol: asNetworkSymbol(symbol),
        index,
        accountType,
        path: path as Bip43Path,
        backendType: backendType as TrezorConnectBackendType | undefined,
        accountInfo,
        visible:
            response.failed ||
            !response.empty ||
            !response.last || // empty account is visible if not the last one
            (response.type === 'normal' && response.index === 0), // first normal account is always visible on web & desktop
        ...(!response.failed ? { failed: undefined } : { failed: true, error: response.error }),
    };

    const discoveryPayload: DiscoveryStatus = {
        status: 'progress' as const,
        progress,
        total,
        hasLoadedAnyNonEmptyAccount: discovery.hasLoadedAnyNonEmptyAccount || !accountInfo.empty,
    };

    return { accountPayload, discoveryPayload };
};

type ApplyDeviceStateErrorThunkProps = {
    error: string | undefined;
    code: string | undefined;
    devicePath: DeviceUniquePath;
};

type ApplyDeviceStateErrorThunkState = UpdateDiscoveryThunkState;

type ApplyDeviceStateErrorThunkDeps = UpdateDiscoveryThunkDeps;

const applyDeviceStateErrorThunk = createThunk<
    void,
    ApplyDeviceStateErrorThunkProps,
    { state: ApplyDeviceStateErrorThunkState; extra: ApplyDeviceStateErrorThunkDeps }
>(
    `${DISCOVERY_MODULE_PREFIX}/applyDeviceStateError`,
    ({ error, code, devicePath }, { dispatch, getState }) => {
        // means that `cancelDiscoveryThunk` has been called and device returned code:Method_Cancel and this specific `error`
        if (error === USER_UI_CANCEL_CODE) return;

        if (code !== undefined && DEVICE_CANCELLATION_CODES.includes(code)) {
            const cancelledDiscovery = selectDiscoveryByDevicePath(getState(), devicePath);

            // The device itself might trigger cancellation, so we need to sync the discovery state
            if (cancelledDiscovery && cancelledDiscovery.status !== 'cancelled') {
                dispatch(
                    updateDiscoveryThunk({ status: { status: 'cancelled' }, path: devicePath }),
                );
            }

            return;
        }

        // The error is not from deliberate cancellation, so we mark the discovery as failed
        dispatch(
            updateDiscoveryThunk({
                status: { status: 'failed', error, errorCode: code },
                path: devicePath,
            }),
        );
    },
);
type CompleteDiscoveryParams = {
    getState: () => DiscoveryReportingThunkState;
    dispatch: ThunkDispatch<DiscoveryReportingThunkState, DiscoveryReportingDeps, UnknownAction>;
    fetchAndSaveMetadata: SuiteCompatibleThunk<StaticSessionId>;
};

const completeDiscovery = (
    devicePath: DeviceUniquePath,
    deviceState: TrezorDeviceWithState['state'],
    { dispatch, fetchAndSaveMetadata, getState }: CompleteDiscoveryParams,
) => {
    dispatch(updateDiscoveryThunk({ status: { status: 'complete' }, path: devicePath }));
    dispatch(fetchAndSaveMetadata(deviceState.staticSessionId));
    dispatch(deviceActions.setDiscovered(deviceState.staticSessionId, true));

    dispatch(reportWalletBalanceThunk());

    selectAccountsByDeviceState(getState(), deviceState.staticSessionId).forEach(account =>
        dispatch(reportAccountInfoThunk(account.key)),
    );
};

type CancelDiscoveryParams = {
    device: TrezorDevice;
    isSilent: boolean;
};

const cancelDiscovery = (
    { device, isSilent }: CancelDiscoveryParams,
    dispatch: ThunkDispatch<UpdateDiscoveryThunkState, UpdateDiscoveryThunkDeps, UnknownAction>,
) => {
    // cancel with a custom error code so we can distinguish it from device cancellation
    TrezorConnect.cancel({ reason: USER_UI_CANCEL_CODE });

    dispatch(
        updateDiscoveryThunk({ status: { status: 'cancelled' }, path: device.path, isSilent }),
    );
};

type CancelDiscoveryThunkState = UpdateDiscoveryThunkState;

type CancelDiscoveryThunkDeps = UpdateDiscoveryThunkDeps;

export const cancelDiscoveryThunk = createThunk<
    void,
    TrezorDevice,
    { state: CancelDiscoveryThunkState; extra: CancelDiscoveryThunkDeps }
>(`${DISCOVERY_MODULE_PREFIX}/cancel`, (device, { dispatch }) =>
    cancelDiscovery({ device, isSilent: false }, dispatch),
);

type CancelDiscoveryForRestartThunkState = UpdateDiscoveryThunkState;

type CancelDiscoveryForRestartThunkDeps = UpdateDiscoveryThunkDeps;

export const cancelDiscoveryForRestartThunk = createThunk<
    void,
    TrezorDevice,
    { state: CancelDiscoveryForRestartThunkState; extra: CancelDiscoveryForRestartThunkDeps }
>(`${DISCOVERY_MODULE_PREFIX}/cancelForRestart`, (device, { dispatch }) =>
    cancelDiscovery({ device, isSilent: true }, dispatch),
);

type RunDiscoveryParams = {
    device: TrezorDevice;
    callId?: string;
};

export type RunDiscoveryThunkState = DiscoveryReportingThunkState;

export type RunDiscoveryThunkDeps = WithServices<AnalyticsDep & GetTradedAccountKeysDep> &
    ProcessDiscoveryEntropyCheckThunkDeps & {
        thunks: FetchAndSaveMetadataDep;
    };

export const runDiscoveryThunk = createThunk<
    void,
    RunDiscoveryParams,
    { state: RunDiscoveryThunkState; extra: RunDiscoveryThunkDeps }
>(
    `${DISCOVERY_MODULE_PREFIX}/run`,
    async ({ device: passedDevice, callId }, { dispatch, getState, extra }): Promise<void> => {
        try {
            let device: TrezorDevice = passedDevice;

            const reselectDevice = (deviceState: TrezorDeviceWithState['state']) => {
                const selectedDevice = selectDeviceByStaticSessionId(
                    getState(),
                    deviceState.staticSessionId,
                );
                if (!selectedDevice) {
                    dispatch(cancelDiscoveryThunk(device));

                    return device;
                }

                assertDeviceIsAcquired(selectedDevice);

                return selectedDevice;
            };

            const discovery = selectDiscoveryByDevicePath(getState(), device.path);

            if (!isDiscoveryInProgress(discovery)) return;

            // Can be changed later:
            // - if the device is passphrase_always_on_device.
            // - if the passphrase typed on device is identified as empty.
            let { isAddingHiddenWallet } = discovery;

            // Standard wallet cannot be created in this setup.
            const isPassphraseAlwaysOnDevice = device.features?.passphrase_always_on_device;
            if (isPassphraseAlwaysOnDevice && !isAddingHiddenWallet) {
                isAddingHiddenWallet = true;
            }

            assertDeviceIsAcquired(device);

            if (isAddingHiddenWallet) {
                dispatch(
                    updateDiscoveryThunk({
                        status: { status: 'enter-passphrase' },
                        path: device.path,
                    }),
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
                    useEmptyPassphrase: !isAddingHiddenWallet,
                },
                callId,
            });

            if (!isDiscoveryInProgress(selectDiscoveryByDevicePath(getState(), device.path))) {
                return;
            }

            if (!deviceStateResponse.success) {
                const { message, code } = deviceStateResponse.error;
                dispatch(
                    applyDeviceStateErrorThunk({ error: message, code, devicePath: device.path }),
                );

                return;
            }

            const deviceState = deviceStateResponse.payload.state;

            assertStaticSessionId(deviceState);

            const { discovered } = device;

            const duplicate = findDuplicateWallet(selectDevices(getState()), device, deviceState);

            if (duplicate?.staticSessionId) {
                if (isAddingHiddenWallet) {
                    dispatch(
                        updateDiscoveryThunk({
                            status: {
                                status: 'passphrase-duplicate',
                                duplicateDeviceStaticSessionId: duplicate.staticSessionId,
                            },
                            path: device.path,
                        }),
                    );
                } else {
                    // Only the passphrase wallet flow has UI for a duplicate, so switch to the existing wallet.
                    dispatch(
                        updateDiscoveryThunk({ status: { status: 'complete' }, path: device.path }),
                    );

                    const duplicatedDevice = selectDeviceByStaticSessionId(
                        getState(),
                        duplicate.staticSessionId,
                    );
                    if (duplicatedDevice) {
                        dispatch(selectDeviceThunk({ device: duplicatedDevice }));
                    }
                }

                return;
            }

            if (isAddingHiddenWallet) {
                const standardWallet = selectDevices(getState()).find(
                    d => d.path === passedDevice.path && d.useEmptyPassphrase,
                );

                if (!standardWallet && !isPassphraseAlwaysOnDevice) {
                    // no passphrase duplicity and no standard wallet -> check that this is not in fact empty passphrase
                    const res = await TrezorConnect.getDeviceState({
                        device: { path: passedDevice.path, useEmptyPassphrase: true },
                        callId,
                    });

                    if (res.success && describesSameWallet(deviceState)(res.payload.state)) {
                        isAddingHiddenWallet = false;
                    }
                }
            }

            if (!isAddingHiddenWallet) {
                await dispatch(
                    applyDeviceStatesThunk({
                        newDeviceState: deviceState,
                        isAddingHiddenWallet,
                        devicePath: passedDevice.path,
                    }),
                );
            }

            device = reselectDevice(deviceState);

            const accountsParam = selectDiscoveryAccountsParam(
                getState(),
                deviceState.staticSessionId,
                discovered,
            );

            // we do not create empty accounts right away, but store the progress events for later
            const accountQueue: CreateAccountActionProps[] = [];
            const onBundleProgress = (event: ProgressEvent) => {
                const currentDiscovery = selectDiscoveryByDevicePath(getState(), device.path);
                if (!currentDiscovery) {
                    return console.error('bundle progress handler: no discovery found');
                }
                // A late event must not reopen a run that has already ended, e.g. on device disconnect.
                if (hasDiscoveryEnded(currentDiscovery)) return;

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
                            dispatch(
                                accountsActions.createAccount(
                                    account,
                                    selectSupportedNetworkSymbols(getState()),
                                ),
                            ),
                        );
                        accountQueue.splice(0, accountQueue.length);
                    }
                    const { account } = dispatch(
                        accountsActions.createAccount(
                            accountPayload,
                            selectSupportedNetworkSymbols(getState()),
                        ),
                    ).payload;

                    // Discovery on a plain RPC node only learns balance and nonce; the tokens
                    // come from a second, per-account request once the account exists.
                    if (shouldFetchAssetsAfterDiscovery(accountPayload)) {
                        dispatch(fetchAndUpdateAccountThunk({ accountKey: account.key }));
                    }
                }

                dispatch(updateDiscoveryThunk({ status: discoveryPayload, path: device.path }));
            };

            const discoveredDevice = device;
            // assertDeviceIsAcquired is already called on `device`, but device is initialized with let. TODO fix.
            assertDeviceIsAcquired(discoveredDevice);
            const onDiscoveryEntropyCheck = ({
                device: checkedDevice,
                success,
                path,
            }: DiscoveryEntropyCheckEvent) => {
                // Ignore events from discoveries running concurrently on other devices.
                if (checkedDevice.id !== discoveredDevice.id) return;
                dispatch(
                    processDiscoveryEntropyCheckThunk({ device: discoveredDevice, success, path }),
                );
            };

            TrezorConnect.on(UI_EVENTS.BUNDLE_PROGRESS, onBundleProgress);
            TrezorConnect.on(UI_EVENTS.DISCOVERY_ENTROPY_CHECK, onDiscoveryEntropyCheck);

            // NOTE: sync set discovery status to progress to make sure that there aren't some hanging states
            // before asnyc onBundleProgress is called which sets progress
            dispatch(
                updateDiscoveryThunk({
                    status: { status: 'progress', total: Infinity, progress: 0 },
                    path: device.path,
                }),
            );

            // have Connect check the discovered account with persisted xpub hashes, but those are valid only for standard wallet
            const entropyCheckResult = selectEntropyCheckResultByDeviceId(getState(), device.id);
            const result = await TrezorConnect.discoverAccounts({
                device: {
                    instance,
                    state: { staticSessionId: deviceState.staticSessionId },
                    useEmptyPassphrase: !isAddingHiddenWallet,
                },
                coins: accountsParam,
                entropyCheckResult,
                callId,
            });

            TrezorConnect.off(UI_EVENTS.BUNDLE_PROGRESS, onBundleProgress);
            TrezorConnect.off(UI_EVENTS.DISCOVERY_ENTROPY_CHECK, onDiscoveryEntropyCheck);

            if (!isDiscoveryInProgress(selectDiscoveryByDevicePath(getState(), device.path))) {
                return;
            }

            if (!result.success) {
                dispatch(
                    updateDiscoveryThunk({
                        status: {
                            status: 'failed',
                            error: result.error.message,
                            errorCode: result.error.code,
                        },
                        path: device.path,
                    }),
                );
                dispatch(deviceActions.setDiscovered(deviceState.staticSessionId, false));

                return;
            }

            if (!isAddingHiddenWallet) {
                completeDiscovery(device.path, deviceState, {
                    dispatch,
                    getState,
                    fetchAndSaveMetadata: extra.thunks.fetchAndSaveMetadata,
                });

                return;
            }

            device = reselectDevice(deviceState);

            const allAccountsEmpty = result.payload.nonempty === 0;
            // there is at least one account with balance - passphrase is not empty
            if (!allAccountsEmpty) {
                completeDiscovery(device.path, deviceState, {
                    dispatch,
                    getState,
                    fetchAndSaveMetadata: extra.thunks.fetchAndSaveMetadata,
                });

                // finish here, device state was applied from bundle progress handler
                return;
            }

            if (!selectDiscoveryByDevicePath(getState(), device.path)) {
                console.error('Discovery aborted: no discovery found, stopping');

                return;
            }

            dispatch(
                updateDiscoveryThunk({
                    status: {
                        status: 'confirm-empty-passphrase',
                        accountFailed: !!result.payload.failed,
                    },
                    path: device.path,
                }),
            );

            const getDeviceState2Res = await TrezorConnect.getDeviceState({
                device: { path: device.path, instance, state: undefined },
                callId,
            });

            if (!isDiscoveryInProgress(selectDiscoveryByDevicePath(getState(), device.path))) {
                return;
            }

            if (!getDeviceState2Res.success) {
                const { message, code } = getDeviceState2Res.error;
                dispatch(
                    applyDeviceStateErrorThunk({ error: message, code, devicePath: device.path }),
                );
                dispatch(deviceActions.setDiscovered(deviceState.staticSessionId, false));

                return;
            }

            // todo: not sure about instance, now it looks that there are 2 devices created in connect
            if (!describesSameWallet(deviceState)(getDeviceState2Res.payload.state)) {
                dispatch(
                    updateDiscoveryThunk({
                        status: { status: 'passphrase-mismatch' },
                        path: device.path,
                    }),
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

            completeDiscovery(device.path, deviceState, {
                dispatch,
                getState,
                fetchAndSaveMetadata: extra.thunks.fetchAndSaveMetadata,
            });
        } catch (error) {
            dispatch(
                updateDiscoveryThunk({
                    status: { status: 'failed', error, errorCode: getErrorCode(error) },
                    path: passedDevice.path,
                }),
            );
        }
    },
);

type StartDiscoveryThunkParams = {
    device: TrezorDevice;
    trigger: DiscoveryTrigger;
    isAddingHiddenWallet?: boolean;
    isAddingExistingWallet?: boolean;
    useScopedCallIds?: boolean;
};

export type StartDiscoveryThunkState = RunDiscoveryThunkState;

export type StartDiscoveryThunkDeps = WithServices<AnalyticsDep & GetTradedAccountKeysDep> & {
    thunks: FetchAndSaveMetadataDep;
};

export const startDiscoveryThunk = createThunk<
    void,
    StartDiscoveryThunkParams,
    { state: StartDiscoveryThunkState; extra: StartDiscoveryThunkDeps }
>(
    `${DISCOVERY_MODULE_PREFIX}/start`,
    (
        { device, trigger, isAddingHiddenWallet, isAddingExistingWallet, useScopedCallIds },
        { dispatch, getState },
    ): void => {
        const currentDiscovery = selectDiscoveryByDevicePath(getState(), device.path);

        if (isDiscoveryInProgress(currentDiscovery)) {
            console.warn(
                'startDiscoveryThunk: discovery already in progress, cancelling start call',
            );

            return;
        }

        dispatch(
            discoveryActions.startDiscovery(device.path, {
                trigger,
                isAddingHiddenWallet,
                isAddingExistingWallet,
                useScopedCallIds,
            }),
        );

        // NOTE: run the discovery only if
        // - we are adding a standard wallet,
        // - or adding an existing hidden wallet,
        // - or adding initially a hidden wallet set by settings
        if (!isAddingHiddenWallet || isAddingExistingWallet) {
            dispatch(runDiscoveryThunk({ device }));
        }
    },
);

type RunAdditionalDiscoveryThunkParams = {
    staticSessionId: StaticSessionId;
    trigger: DiscoveryTrigger;
};

export type RunAdditionalDiscoveryThunkState = RunDiscoveryThunkState;

export type RunAdditionalDiscoveryThunkDeps = WithServices<AnalyticsDep & GetTradedAccountKeysDep> &
    ProcessDiscoveryEntropyCheckThunkDeps;

export const runAdditionalDiscoveryThunk = createThunk<
    void,
    RunAdditionalDiscoveryThunkParams,
    { state: RunAdditionalDiscoveryThunkState; extra: RunAdditionalDiscoveryThunkDeps }
>(
    `${DISCOVERY_MODULE_PREFIX}/runAdditional`,
    async ({ staticSessionId, trigger }, { dispatch, getState }): Promise<void> => {
        // todo: not now, but in the future, there could be more devices (wallets) sharing the same static session id, for example
        // an imported wallet + wallet on the physical device. So this should run for all the applicable devices/wallets

        const device = selectDeviceByStaticSessionId(getState(), staticSessionId);

        assertDeviceIsAuthorized(device);

        const accountsToRemove = selectAccountsToBeForgotten(getState());
        if (accountsToRemove.length > 0) {
            dispatch(accountsActions.removeAccount(accountsToRemove));
        }

        dispatch(
            discoveryActions.startDiscovery(device.path, {
                trigger,
                isAddingHiddenWallet: false,
                isAddingExistingWallet: false,
            }),
        );

        // NOTE: prepare the device to the corresponding state eg. insert the passphrase
        const deviceStateResponse = await TrezorConnect.getDeviceState({
            device: {
                path: device.path,
                instance: device.instance,
                state: { staticSessionId: device.state.staticSessionId },
                useEmptyPassphrase: device.useEmptyPassphrase,
            },
        });

        if (!deviceStateResponse.success) {
            const { message, code } = deviceStateResponse.error;
            dispatch(applyDeviceStateErrorThunk({ error: message, code, devicePath: device.path }));

            return;
        }

        assertStaticSessionId(deviceStateResponse.payload.state);

        if (device.useEmptyPassphrase) {
            dispatch(
                deviceActions.setDeviceState({
                    device,
                    state: deviceStateResponse.payload.state,
                    useEmptyPassphrase: device.useEmptyPassphrase,
                }),
            );
        }

        // NOTE: keep here the previous device as default to prevent TS from screaming
        const updatedDevice = selectDeviceByStaticSessionId(getState(), staticSessionId) ?? device;

        const accountsParam = selectDiscoveryAccountsParam(
            getState(),
            staticSessionId,
            device.discovered,
        );

        const onBundleProgress = (event: ProgressEvent) => {
            const discovery = selectDiscoveryByDevicePath(getState(), device.path);
            if (!discovery) {
                return console.error('bundle progress handler: no discovery found');
            }
            // A late event must not reopen a run that has already ended, e.g. on device disconnect.
            if (hasDiscoveryEnded(discovery)) return;

            const { accountPayload, discoveryPayload } = transformProgressEventData(
                event,
                device.state.staticSessionId,
                discovery,
            );

            dispatch(
                accountsActions.createAccount(
                    accountPayload,
                    selectSupportedNetworkSymbols(getState()),
                ),
            );
            dispatch(updateDiscoveryThunk({ status: discoveryPayload, path: device.path }));
        };

        const onDiscoveryEntropyCheck = ({
            device: checkedDevice,
            success,
            path,
        }: DiscoveryEntropyCheckEvent) => {
            // Ignore events from discoveries running concurrently on other devices.
            if (checkedDevice.id !== device.id) return;
            dispatch(processDiscoveryEntropyCheckThunk({ device, success, path }));
        };

        TrezorConnect.on(UI_EVENTS.BUNDLE_PROGRESS, onBundleProgress);
        TrezorConnect.on(UI_EVENTS.DISCOVERY_ENTROPY_CHECK, onDiscoveryEntropyCheck);

        // have Connect check the discovered account with persisted xpub hashes, but those are valid only for standard wallet
        const entropyCheckResult = selectEntropyCheckResultByDeviceId(getState(), device.id);
        // NOTE: pass only staticSessionId (not the full updatedDevice) to avoid overwriting the freshly-derived
        // sessionId in Connect's in-memory Device cache with the stale value stored in Redux state.
        // Connect's setState merge logic preserves the up-to-date sessionId when only staticSessionId is provided.
        // This mirrors the behaviour of runDiscoveryThunk and prevents repeated passphrase prompts.
        const result = await TrezorConnect.discoverAccounts({
            device: {
                path: updatedDevice.path,
                instance: updatedDevice.instance,
                state: { staticSessionId },
                useEmptyPassphrase: updatedDevice.useEmptyPassphrase,
            },
            coins: accountsParam,
            entropyCheckResult,
        });

        TrezorConnect.off(UI_EVENTS.BUNDLE_PROGRESS, onBundleProgress);
        TrezorConnect.off(UI_EVENTS.DISCOVERY_ENTROPY_CHECK, onDiscoveryEntropyCheck);

        dispatch(
            updateDiscoveryThunk({
                status: result.success
                    ? { status: 'complete' }
                    : {
                          status: 'failed',
                          error: result.error.message,
                          errorCode: result.error.code,
                      },
                path: updatedDevice.path,
            }),
        );
        dispatch(deviceActions.setDiscovered(staticSessionId, result.success));

        if (result.success) {
            dispatch(reportWalletBalanceThunk());

            selectAccountsByDeviceState(getState(), staticSessionId).forEach(account =>
                dispatch(reportAccountInfoThunk(account.key)),
            );
        }
    },
);

type EndUnfinishedDiscoveryThunkParams = {
    devicePath: DeviceUniquePath;
    status: Extract<DiscoveryStatus, { status: DiscoveryOutcome }>;
};

export type EndUnfinishedDiscoveryThunkState = UpdateDiscoveryThunkState;

export type EndUnfinishedDiscoveryThunkDeps = UpdateDiscoveryThunkDeps;

/**
 * Ends a run that has no outcome yet when its device disconnects, on desktop and mobile. A run that is
 * talking to the device fails on its own, but one that never reached Connect (e.g. a new hidden wallet
 * waiting on the best-practices screen) would otherwise never report an outcome. No-op once the run ended.
 */
export const endUnfinishedDiscoveryThunk = createThunk<
    void,
    EndUnfinishedDiscoveryThunkParams,
    { state: EndUnfinishedDiscoveryThunkState; extra: EndUnfinishedDiscoveryThunkDeps }
>(`${DISCOVERY_MODULE_PREFIX}/endUnfinished`, ({ devicePath, status }, { dispatch, getState }) => {
    const discovery = selectDiscoveryByDevicePath(getState(), devicePath);
    if (!discovery || hasDiscoveryEnded(discovery)) return;

    dispatch(updateDiscoveryThunk({ status, path: devicePath }));
});

type SubmitPassphraseThunkParams = {
    device: TrezorDevice;
    passphrase: string;
    passphraseOnDevice?: boolean;
    requestId?: string;
};

type SubmitPassphraseThunkState = UpdateDiscoveryThunkState;

type SubmitPassphraseThunkDeps = UpdateDiscoveryThunkDeps;

export const submitPassphraseThunk = createThunk<
    void,
    SubmitPassphraseThunkParams,
    { state: SubmitPassphraseThunkState; extra: SubmitPassphraseThunkDeps }
>(
    `${DISCOVERY_MODULE_PREFIX}/submitPassphrase`,
    ({ device, passphrase, passphraseOnDevice, requestId }, { dispatch, getState }) => {
        const currentDiscovery = selectDiscoveryByDevicePath(getState(), device.path);

        if (currentDiscovery) {
            dispatch(
                updateDiscoveryThunk({
                    status: { ...currentDiscovery, passphraseSubmitted: true, passphraseOnDevice },
                    path: device.path,
                }),
            );
        }

        TrezorConnect.uiResponse({
            type: UI_RESPONSE.RECEIVE_PASSPHRASE,
            payload: {
                value: passphrase,
                save: true,
                passphraseOnDevice,
            },
            requestId,
        });
    },
);

type StartOrRestartDiscoveryThunkParams = {
    trigger: DiscoveryTrigger;
};

type StartOrRestartDiscoveryThunkState = RunDiscoveryThunkState;

type StartOrRestartDiscoveryThunkDeps = WithServices<AnalyticsDep & GetTradedAccountKeysDep> & {
    thunks: FetchAndSaveMetadataDep;
};

/**
 * Helper to restart discovery for currently selected device
 */
export const startOrRestartDiscoveryThunk = createThunk<
    void,
    StartOrRestartDiscoveryThunkParams,
    { state: StartOrRestartDiscoveryThunkState; extra: StartOrRestartDiscoveryThunkDeps }
>(`${DISCOVERY_MODULE_PREFIX}/restart`, ({ trigger }, { dispatch, getState }) => {
    const device = selectSelectedDevice(getState());
    if (!device) return;
    const staticSessionId = device.state?.staticSessionId;
    if (staticSessionId) {
        // we already have staticSessionId (=passphrase state), we probably failed during blockchain discovery
        dispatch(runAdditionalDiscoveryThunk({ staticSessionId, trigger }));

        return;
    }

    // if no staticSessionId available yet it means we failed sooner, for example during pin input
    dispatch(
        startDiscoveryThunk({
            device,
            trigger,
            isAddingExistingWallet: true,
            isAddingHiddenWallet: false,
        }),
    );
});

type SwitchToDuplicatedWalletThunkState = DeviceRootState & CancelDiscoveryThunkState;

type SwitchToDuplicatedWalletThunkDeps = CancelDiscoveryThunkDeps;

export const switchToDuplicatedWalletThunk = createThunk<
    void,
    void,
    { state: SwitchToDuplicatedWalletThunkState; extra: SwitchToDuplicatedWalletThunkDeps }
>(`${DISCOVERY_MODULE_PREFIX}/switchToDuplicatedWallet`, (_, { dispatch, getState }) => {
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
});
