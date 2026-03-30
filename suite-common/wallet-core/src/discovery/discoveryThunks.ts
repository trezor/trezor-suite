import { type ThunkDispatch } from '@reduxjs/toolkit';

import { events } from '@suite-common/analytics';
import {
    deviceActions,
    selectDeviceByStaticSessionId,
    selectDevices,
    selectEntropyCheckResultByDeviceId,
    selectSelectedDevice,
} from '@suite-common/device';
import {
    type AnyAction,
    type ExtraDependencies,
    type SuiteCompatibleThunk,
    createThunk,
} from '@suite-common/redux-utils';
import {
    type AcquiredDevice,
    type AuthorizedDevice,
    type TrezorDevice,
    type TrezorDeviceWithState,
} from '@suite-common/suite-types';
import { getNewInstanceNumber } from '@suite-common/suite-utils';
import {
    type Bip43Path,
    type NetworkSymbol,
    type TrezorConnectBackendType,
    isNetworkSymbol,
} from '@suite-common/wallet-config';
import {
    type Account,
    type DiscoveryStatus,
    type TokenSymbol,
    toTokenAddress,
} from '@suite-common/wallet-types';
import {
    getAccountTotalStakingBalance,
    getAccountsWithSomeTransactionHistory,
    getStakingProvidersForAnalytics,
} from '@suite-common/wallet-utils';
import TrezorConnect, {
    type AccountInfo,
    type BundleProgress,
    type DeviceState,
    type DeviceUniquePath,
    type StaticSessionId,
    UI_REQUEST,
    UI_RESPONSE,
} from '@trezor/connect';
import { type DiscoverAccountsProgress } from '@trezor/connect-common/src/types/api/discoverAccounts';
import { BigNumber, typedObjectEntries } from '@trezor/utils';

import { DISCOVERY_MODULE_PREFIX, discoveryActions } from './discoveryActions';
import { isDiscoveryInProgress, selectDiscoveryByDevicePath } from './discoverySelectors';
import { selectDeviceThunk } from './selectDeviceThunk';
import { type CreateAccountActionProps, accountsActions } from '../accounts/accountsActions';
import { selectAccountsByDeviceState } from '../accounts/accountsSelectors';
import { selectAccountsToBeForgotten, selectDiscoveryAccountsParam } from '../selectors';
import { selectIsDeviceAutoEjectEnabled } from '../settings/walletSettingsReducer';

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

const deviceStateEqualTo = (first: DeviceState) => {
    const firstParsed = first.staticSessionId?.split(':')[0];

    return (second?: DeviceState) =>
        firstParsed ? firstParsed === second?.staticSessionId?.split(':')[0] : false;
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

export const applyDeviceStatesThunk = createThunk<
    { device: TrezorDevice },
    {
        isAddingHiddenWallet?: boolean;
        newDeviceState: DeviceState;
        devicePath: DeviceUniquePath;
    },
    { rejectValue: string }
>(
    `${DISCOVERY_MODULE_PREFIX}/applyDeviceStates`,
    async (
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
            const device = devicesByPath[0];

            assertDeviceIsAcquired(device);
            assertStaticSessionId(newDeviceState);
            const { staticSessionId } = newDeviceState;

            const useEmptyPassphrase = !isAddingHiddenWallet;

            // now we expect that there is exactly one device without state - meaning that we want to update its state
            const isAutoEjectEnabled = selectIsDeviceAutoEjectEnabled(getState());

            if (devicesByPathWithoutState.length === 1) {
                dispatch(
                    deviceActions.setDeviceState({
                        device,
                        state: newDeviceState,
                        useEmptyPassphrase,
                        isAutoEjectEnabled,
                    }),
                );
            } else {
                dispatch(
                    deviceActions.addAuthorizedDevice({
                        device,
                        state: newDeviceState,
                        useEmptyPassphrase,
                        isAutoEjectEnabled,
                    }),
                );

                // select the device after deviceReducer updates it (it's a new object reference)
                const newlyAddedDevice = selectDeviceByStaticSessionId(getState(), staticSessionId);
                if (newlyAddedDevice === undefined) {
                    return rejectWithValue('applyDeviceStatesThunk: newly added device not found');
                }
                dispatch(selectDeviceThunk({ device: newlyAddedDevice }));
            }

            await dispatch(initNewDeviceStateMetadataThunk(staticSessionId));

            return fulfillWithValue({ device });
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
        symbol,
        index,
        accountType,
        path: path as Bip43Path,
        backendType: backendType as TrezorConnectBackendType | undefined,
        accountInfo,
        // first normal account is always visible on web & desktop
        visible: response.failed || !response.empty || (accountType === 'normal' && index === 0),
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

const trackCompleteDiscoveryResult = (
    deviceStaticSessionId: StaticSessionId,
    {
        getState,
        analytics,
    }: { getState: () => any; analytics: ExtraDependencies['services']['analytics'] },
) => {
    const discoveredAccounts = selectAccountsByDeviceState(getState(), deviceStaticSessionId);

    const accountsBySymbol = discoveredAccounts.reduce<Record<NetworkSymbol, Account[]>>(
        (agg, account) => {
            const { symbol } = account;
            if (!agg[symbol]) {
                agg[symbol] = [];
            }
            agg[symbol].push(account);

            return agg;
        },
        {} as Record<NetworkSymbol, Account[]>,
    );

    typedObjectEntries(accountsBySymbol).forEach(([symbol, accounts]) => {
        if (isNetworkSymbol(symbol)) {
            analytics.report({
                type: events.coinDiscoveryEvent.name,
                payload: {
                    discoveryId: deviceStaticSessionId,
                    symbol,
                    numberOfAccounts: getAccountsWithSomeTransactionHistory(accounts).length,
                    numberOfNonZeroAccounts: accounts.filter(account => !account.empty).length,
                    tokenSymbols: accounts.flatMap(
                        account =>
                            account.tokens
                                ?.map(token => token.symbol)
                                .filter(
                                    (tokenSymbol): tokenSymbol is TokenSymbol => !!tokenSymbol,
                                ) ?? [],
                    ),
                    tokenAddresses: accounts.flatMap(
                        account =>
                            account.tokens?.map(token => toTokenAddress(token.contract)) ?? [],
                    ),
                    numberOfStakedAccounts: accounts.filter(account =>
                        new BigNumber(getAccountTotalStakingBalance(account) || 0).gt(0),
                    ).length,
                    stakingProviders: getStakingProvidersForAnalytics(accounts),
                },
            });
        }
    });
};

const completeDiscovery = (
    devicePath: DeviceUniquePath,
    deviceState: TrezorDeviceWithState['state'],
    {
        analytics,
        dispatch,
        fetchAndSaveMetadata,
        getState,
    }: {
        getState: () => any;
        dispatch: ThunkDispatch<any, ExtraDependencies, AnyAction>;
        fetchAndSaveMetadata: SuiteCompatibleThunk<StaticSessionId>;
        analytics: ExtraDependencies['services']['analytics'];
    },
) => {
    dispatch(discoveryActions.updateDiscovery({ status: 'complete' }, devicePath));
    dispatch(fetchAndSaveMetadata(deviceState.staticSessionId));
    dispatch(deviceActions.setDiscovered(deviceState.staticSessionId, true));

    trackCompleteDiscoveryResult(deviceState.staticSessionId, {
        getState,
        analytics,
    });
};

export const cancelDiscoveryThunk = createThunk(
    `${DISCOVERY_MODULE_PREFIX}/cancel`,
    (device: TrezorDevice, { dispatch }) => {
        // cancel with a custom error code so we can distinguish it from device cancellation
        TrezorConnect.cancel(USER_UI_CANCEL_CODE);

        dispatch(discoveryActions.updateDiscovery({ status: 'cancelled' }, device.path));
    },
);

export const runDiscoveryThunk = createThunk(
    `${DISCOVERY_MODULE_PREFIX}/run`,
    async (passedDevice: TrezorDevice, { dispatch, getState, extra }): Promise<void> => {
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

            // Can be changed later if the passphrase typed on device is identified as empty
            let { isAddingHiddenWallet } = discovery;

            assertDeviceIsAcquired(device);

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
                    useEmptyPassphrase: !isAddingHiddenWallet,
                },
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

            if (isAddingHiddenWallet) {
                const duplicate = selectDevices(getState())
                    .map(d => d.state)
                    .find(deviceStateEqualTo(deviceState));

                if (duplicate?.staticSessionId) {
                    dispatch(
                        discoveryActions.updateDiscovery(
                            {
                                status: 'passphrase-duplicate',
                                duplicateDeviceStaticSessionId: duplicate.staticSessionId,
                            },
                            device.path,
                        ),
                    );

                    return;
                }

                const standardWallet = selectDevices(getState()).find(
                    d => d.path === passedDevice.path && d.useEmptyPassphrase,
                );

                if (!standardWallet) {
                    // no passphrase duplicity and no standard wallet -> check that this is not in fact empty passphrase
                    const res = await TrezorConnect.getDeviceState({
                        device: { path: passedDevice.path, useEmptyPassphrase: true },
                    });

                    if (res.success && deviceStateEqualTo(deviceState)(res.payload.state)) {
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

            TrezorConnect.on(UI_REQUEST.BUNDLE_PROGRESS, onBundleProgress);

            // NOTE: sync set discovery status to progress to make sure that there aren't some hanging states
            // before asnyc onBundleProgress is called which sets progress
            dispatch(
                discoveryActions.updateDiscovery(
                    { status: 'progress', total: Infinity, progress: 0 },
                    device.path,
                ),
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
            });

            TrezorConnect.off(UI_REQUEST.BUNDLE_PROGRESS, onBundleProgress);

            if (!isDiscoveryInProgress(selectDiscoveryByDevicePath(getState(), device.path))) {
                return;
            }

            if (!result.success) {
                dispatch(
                    discoveryActions.updateDiscovery(
                        {
                            status: 'failed',
                            error: result.error.message,
                            errorCode: result.error.code,
                        },
                        device.path,
                    ),
                );
                dispatch(deviceActions.setDiscovered(deviceState.staticSessionId, false));

                return;
            }

            if (!isAddingHiddenWallet) {
                completeDiscovery(device.path, deviceState, {
                    analytics: extra.services.analytics,
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
                    analytics: extra.services.analytics,
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
                discoveryActions.updateDiscovery(
                    { status: 'confirm-empty-passphrase', accountFailed: !!result.payload.failed },
                    device.path,
                ),
            );

            const getDeviceState2Res = await TrezorConnect.getDeviceState({
                device: { path: device.path, instance, state: undefined },
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
            if (!deviceStateEqualTo(deviceState)(getDeviceState2Res.payload.state)) {
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

            completeDiscovery(device.path, deviceState, {
                analytics: extra.services.analytics,
                dispatch,
                getState,
                fetchAndSaveMetadata: extra.thunks.fetchAndSaveMetadata,
            });
        } catch (error) {
            dispatch(
                discoveryActions.updateDiscovery({ status: 'failed', error }, passedDevice.path),
            );
        }
    },
);

type StartDiscoveryThunkParams = {
    device: TrezorDevice | undefined;
    isAddingHiddenWallet?: boolean;
    isAddingExistingWallet?: boolean;
};

export const startDiscoveryThunk = createThunk(
    `${DISCOVERY_MODULE_PREFIX}/start`,
    (
        { device, isAddingHiddenWallet, isAddingExistingWallet }: StartDiscoveryThunkParams,
        { dispatch, getState },
    ): void => {
        if (!device) {
            console.warn('startDiscoveryThunk: no device found');

            return;
        }

        const currentDiscovery = selectDiscoveryByDevicePath(getState(), device.path);

        if (isDiscoveryInProgress(currentDiscovery)) {
            console.warn(
                'startDiscoveryThunk: discovery already in progress, cancelling start call',
            );

            return;
        }

        dispatch(
            discoveryActions.startDiscovery(device.path, {
                isAddingHiddenWallet,
                isAddingExistingWallet,
            }),
        );

        // NOTE: run the discovery only if
        // - we are adding a standard wallet,
        // - or adding an existing hidden wallet,
        // - or adding initially a hidden wallet set by settings
        if (!isAddingHiddenWallet || isAddingExistingWallet) {
            dispatch(runDiscoveryThunk(device));
        }
    },
);

export const runAdditionalDiscoveryThunk = createThunk(
    `${DISCOVERY_MODULE_PREFIX}/runAdditional`,
    async (staticSessionId: StaticSessionId, { dispatch, getState, extra }): Promise<void> => {
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
            const isAutoEjectEnabled = selectIsDeviceAutoEjectEnabled(getState());
            dispatch(
                deviceActions.setDeviceState({
                    device,
                    state: deviceStateResponse.payload.state,
                    useEmptyPassphrase: device.useEmptyPassphrase,
                    isAutoEjectEnabled,
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

            const { accountPayload, discoveryPayload } = transformProgressEventData(
                event,
                device.state.staticSessionId,
                discovery,
            );

            dispatch(accountsActions.createAccount(accountPayload));
            dispatch(discoveryActions.updateDiscovery(discoveryPayload, device.path));
        };

        TrezorConnect.on(UI_REQUEST.BUNDLE_PROGRESS, onBundleProgress);

        // have Connect check the discovered account with persisted xpub hashes, but those are valid only for standard wallet
        const entropyCheckResult = selectEntropyCheckResultByDeviceId(getState(), device.id);
        const result = await TrezorConnect.discoverAccounts({
            device: updatedDevice,
            coins: accountsParam,
            entropyCheckResult,
        });

        TrezorConnect.off(UI_REQUEST.BUNDLE_PROGRESS, onBundleProgress);

        dispatch(
            discoveryActions.updateDiscovery(
                result.success
                    ? { status: 'complete' }
                    : {
                          status: 'failed',
                          error: result.error.message,
                          errorCode: result.error.code,
                      },
                updatedDevice.path,
            ),
        );
        dispatch(deviceActions.setDiscovered(staticSessionId, result.success));

        if (result.success) {
            trackCompleteDiscoveryResult(staticSessionId, {
                getState,
                analytics: extra.services.analytics,
            });
        }
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
            type: UI_RESPONSE.RECEIVE_PASSPHRASE,
            payload: {
                value: passphrase,
                save: true,
                passphraseOnDevice,
            },
        });
    },
);

/**
 * Helper to restart discovery for currently selected device
 */
export const startOrRestartDiscoveryThunk = createThunk(
    `${DISCOVERY_MODULE_PREFIX}/restart`,
    (_, { dispatch, getState }) => {
        const device = selectSelectedDevice(getState());
        if (!device) return;
        const staticSessionId = device.state?.staticSessionId;
        if (staticSessionId) {
            // we already have staticSessionId (=passphrase state), we probably failed during blockchain discovery
            dispatch(runAdditionalDiscoveryThunk(staticSessionId));

            return;
        }

        // if no staticSessionId available yet it means we failed sooner, for example during pin input
        dispatch(
            startDiscoveryThunk({
                device,
                isAddingExistingWallet: true,
                isAddingHiddenWallet: false,
            }),
        );
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
