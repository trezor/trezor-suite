import { A, G, pipe } from '@mobily/ts-belt';

import { getWeakRandomId } from '@trezor/utils';
import { createThunk } from '@suite-common/redux-utils';
import {
    accountsActions,
    DISCOVERY_MODULE_PREFIX,
    selectDeviceDiscovery,
    updateDiscovery,
    createDiscovery,
    removeDiscovery,
    getAvailableCardanoDerivationsThunk,
    selectDeviceByState,
    selectDeviceAccountByDescriptorAndNetworkSymbol,
    selectDevice,
    LIMIT,
    selectDeviceAccountsForNetworkSymbolAndAccountType,
} from '@suite-common/wallet-core';
import { selectIsAccountAlreadyDiscovered } from '@suite-native/accounts';
import TrezorConnect from '@trezor/connect';
import { Account, DiscoveryItem } from '@suite-common/wallet-types';
import { getDerivationType, tryGetAccountIdentity } from '@suite-common/wallet-utils';
import { AccountType, Network, NetworkSymbol, getNetworkType } from '@suite-common/wallet-config';
import { DiscoveryStatus } from '@suite-common/wallet-constants';
import { requestDeviceAccess } from '@suite-native/device-mutex';
import { analytics, EventType } from '@suite-native/analytics';
import { FeatureFlag, selectIsFeatureFlagEnabled } from '@suite-native/feature-flags';

import {
    selectEnabledDiscoveryNetworkSymbols,
    selectDiscoveryStartTimeStamp,
    selectDiscoverySupportedNetworks,
    setDiscoveryStartTimestamp,
} from './discoveryConfigSlice';
import { selectDiscoveryAccountsAnalytics } from './discoverySelectors';

const DISCOVERY_DEFAULT_BATCH_SIZE = 2;

export const NORMAL_ACCOUNT_TYPE: AccountType = 'normal';

const DISCOVERY_BATCH_SIZE_PER_COIN: Partial<Record<NetworkSymbol, number>> = {
    bch: 1,
    dash: 1,
    btg: 1,
    dgb: 1,
    nmc: 1,
    vtc: 1,
    zec: 1,
    etc: 1,
};

const getBatchSizeByCoin = (coin: NetworkSymbol): number => {
    if (coin in DISCOVERY_BATCH_SIZE_PER_COIN) {
        return DISCOVERY_BATCH_SIZE_PER_COIN[coin]!;
    }

    return DISCOVERY_DEFAULT_BATCH_SIZE;
};

type DiscoveryDescriptorItem = DiscoveryItem & { descriptor: string };

const fetchBundleDescriptorsThunk = createThunk(
    `${DISCOVERY_MODULE_PREFIX}/fetchBundleDescriptorsThunk`,
    async (bundle: DiscoveryItem[], { getState }) => {
        const device = selectDevice(getState());

        const { success, payload } = await TrezorConnect.getAccountDescriptor({
            bundle,
            skipFinalReload: true,
            device,
            useEmptyPassphrase: device?.useEmptyPassphrase,
        });

        if (success && payload)
            return pipe(
                payload,
                A.filter(G.isNotNullable),
                A.map(bundleItem => bundleItem.descriptor),
                A.zipWith(bundle, (descriptor, bundleItem) => ({ ...bundleItem, descriptor })),
            ) as DiscoveryDescriptorItem[];

        return [];
    },
);

const finishNetworkTypeDiscoveryThunk = createThunk(
    `${DISCOVERY_MODULE_PREFIX}/finishNetworkTypeDiscoveryThunk`,
    (_, { dispatch, getState }) => {
        const discovery = selectDeviceDiscovery(getState());

        if (!discovery) {
            return;
        }

        const finishedNetworksCount = discovery.loaded + 1;
        dispatch(
            updateDiscovery({
                ...discovery,
                loaded: finishedNetworksCount,
            }),
        );

        if (finishedNetworksCount >= discovery.total) {
            dispatch(removeDiscovery(discovery.deviceState));

            // Id used to group multiple analytic events of a single discovery run together.
            const discoveryId = getWeakRandomId(10);

            const discoveryAccountsAnalytics = selectDiscoveryAccountsAnalytics(
                getState(),
                discovery.deviceState,
            );

            // Keboola analytics data backend is unable to parse nested objects, so each network has to be reported separately.
            Object.entries(discoveryAccountsAnalytics).forEach(
                ([networkSymbol, networkAnalyticsPayload]) => {
                    analytics.report({
                        type: EventType.CoinDiscovery,
                        payload: {
                            discoveryId,
                            symbol: networkSymbol as NetworkSymbol,
                            ...networkAnalyticsPayload,
                        },
                    });
                },
            );

            const discoveryStartTime = selectDiscoveryStartTimeStamp(getState());
            // Discovery analytics duration tracking
            if (discoveryStartTime !== null) {
                const endTime = performance.now();
                const duration = endTime - discoveryStartTime;

                analytics.report({
                    type: EventType.DiscoveryDuration,
                    payload: { discoveryId, loadDuration: duration },
                });
                dispatch(setDiscoveryStartTimestamp(null));
            }
        }
    },
);

const getAccountInfoDetailsLevel = (coin: NetworkSymbol) => {
    const networkType = getNetworkType(coin);
    // For Cardano we need to fetch at least one tx otherwise it will not generate correctly new receive addresses (xpub instead of address)
    if (networkType === 'cardano') return { details: 'txs', pageSize: 1 } as const;

    // CAUTION: the detail level has to be set to "tokenBalances" or higher. In other case we won't get account receive addresses from the backend.
    return { details: 'tokenBalances' } as const;
};

const getCardanoSupportedAccountTypesThunk = createThunk(
    `${DISCOVERY_MODULE_PREFIX}/getCardanoSupportedAccountTypesThunk`,
    async (
        {
            deviceState,
        }: {
            deviceState: string;
        },
        { dispatch, getState },
    ) => {
        const device = selectDeviceByState(getState(), deviceState);
        if (!device) {
            return undefined;
        }
        const availableCardanoDerivationsResponse = await requestDeviceAccess(() =>
            dispatch(getAvailableCardanoDerivationsThunk({ deviceState, device })).unwrap(),
        );

        if (availableCardanoDerivationsResponse.success) {
            return availableCardanoDerivationsResponse.payload;
        }
    },
);

const addAccountByDescriptorThunk = createThunk(
    `${DISCOVERY_MODULE_PREFIX}/addAccountByDescriptorThunk`,
    async (
        {
            deviceState,
            bundleItem,
            identity,
        }: {
            deviceState: string;
            bundleItem: DiscoveryDescriptorItem;
            identity?: string;
        },
        { dispatch, getState },
    ) => {
        const device = selectDevice(getState());
        const { success, payload: accountInfo } = await TrezorConnect.getAccountInfo({
            coin: bundleItem.coin,
            identity,
            device,
            descriptor: bundleItem.descriptor,
            useEmptyPassphrase: device?.useEmptyPassphrase,
            skipFinalReload: true,
            ...getAccountInfoDetailsLevel(bundleItem.coin),
        });

        if (success) {
            dispatch(
                accountsActions.createIndexLabeledAccount({
                    discoveryItem: bundleItem,
                    deviceState,
                    accountInfo,
                    visible: true,
                }),
            );

            analytics.report({
                type: EventType.CoinDiscoveryNewAccount,
                payload: {
                    symbol: bundleItem.coin,
                    path: bundleItem.path,
                    type: bundleItem.accountType,
                },
            });
        }
    },
);

const discoverAccountsByDescriptorThunk = createThunk(
    `${DISCOVERY_MODULE_PREFIX}/discoverAccountsByDescriptorThunk`,
    async (
        {
            descriptorsBundle,
            deviceState,
            identity,
        }: {
            descriptorsBundle: DiscoveryDescriptorItem[];
            deviceState: string;
            identity?: string;
        },
        { dispatch, getState },
    ) => {
        let isFinalRound = false;

        if (A.isEmpty(descriptorsBundle)) {
            isFinalRound = true;
        }

        const device = selectDevice(getState());
        for (const bundleItem of descriptorsBundle) {
            const { success, payload: accountInfo } = await TrezorConnect.getAccountInfo({
                coin: bundleItem.coin,
                identity,
                descriptor: bundleItem.descriptor,
                device,
                useEmptyPassphrase: device?.useEmptyPassphrase,
                skipFinalReload: true,
                ...getAccountInfoDetailsLevel(bundleItem.coin),
            });

            if (success) {
                if (accountInfo.empty) {
                    isFinalRound = true;
                }

                dispatch(
                    accountsActions.createIndexLabeledAccount({
                        discoveryItem: bundleItem,
                        deviceState,
                        accountInfo,
                        visible: !accountInfo.empty,
                    }),
                );
            }
        }

        return isFinalRound;
    },
);

export const addAndDiscoverNetworkAccountThunk = createThunk(
    `${DISCOVERY_MODULE_PREFIX}/addAndDiscoverNetworkAccountThunk`,
    async (
        {
            network,
            deviceState,
        }: {
            network: Network;
            deviceState: string;
        },
        { dispatch, getState },
    ): Promise<Account | undefined> => {
        const accountType = network.accountType ?? NORMAL_ACCOUNT_TYPE;

        const accounts = selectDeviceAccountsForNetworkSymbolAndAccountType(
            getState(),
            network.symbol,
            accountType,
        );

        const index = accounts.length;

        if (index > LIMIT) {
            return undefined;
        }

        const accountPath = network.bip43Path.replace('i', index.toString());

        // Take exclusive access to the device and hold it until fetching of the descriptors is done.
        const deviceAccessResponse = await requestDeviceAccess(() =>
            dispatch(
                fetchBundleDescriptorsThunk([
                    {
                        path: accountPath,
                        coin: network.symbol,
                        index,
                        accountType,
                        networkType: network.networkType,
                        derivationType: getDerivationType(accountType),
                        suppressBackupWarning: true,
                        skipFinalReload: true,
                    },
                ]),
            ).unwrap(),
        );

        if (!deviceAccessResponse.success) {
            return undefined;
        }

        if (deviceAccessResponse.payload.length < 1) {
            return undefined;
        }

        const descriptor = deviceAccessResponse.payload[0];
        const identity = tryGetAccountIdentity({ deviceState, networkType: network.networkType });

        await dispatch(
            addAccountByDescriptorThunk({
                bundleItem: descriptor,
                deviceState,
                identity,
            }),
        ).unwrap();

        const account = selectDeviceAccountByDescriptorAndNetworkSymbol(
            getState(),
            descriptor.descriptor,
            network.symbol,
        );

        return account ?? undefined;
    },
);

const discoverNetworkBatchThunk = createThunk(
    `${DISCOVERY_MODULE_PREFIX}/discoverNetworkBatchThunk`,
    async (
        {
            deviceState,
            round = 1,
            network,
        }: {
            deviceState: string;
            round?: number;
            network: Network;
        },
        { dispatch, getState },
    ) => {
        const discovery = selectDeviceDiscovery(getState());
        const batchSize = getBatchSizeByCoin(network.symbol);

        if (!discovery || !deviceState) {
            return;
        }

        const accountType = network.accountType || NORMAL_ACCOUNT_TYPE;

        const lastDiscoveredAccountIndex = (round - 1) * batchSize;

        // Skip Cardano legacy/ledger account types if device does not support it.
        const isIncompatibleCardanoType =
            network.networkType === 'cardano' &&
            (network.accountType === 'ledger' || network.accountType === 'legacy') &&
            !discovery.availableCardanoDerivations?.includes(network.accountType);

        if (isIncompatibleCardanoType) {
            dispatch(finishNetworkTypeDiscoveryThunk());

            return;
        }

        const chunkBundle: Array<DiscoveryItem> = [];

        A.makeWithIndex(batchSize, batchIndex => {
            const index = lastDiscoveredAccountIndex + batchIndex;
            const accountPath = network.bip43Path.replace('i', index.toString());

            const isAccountAlreadyDiscovered = selectIsAccountAlreadyDiscovered(getState(), {
                deviceState,
                networkSymbol: network.symbol,
                path: accountPath,
            });

            if (!isAccountAlreadyDiscovered) {
                chunkBundle.push({
                    path: accountPath,
                    coin: network.symbol,
                    index,
                    accountType,
                    networkType: network.networkType,
                    derivationType: getDerivationType(accountType),
                    suppressBackupWarning: true,
                    skipFinalReload: true,
                });
            }
        });

        // All accounts of the batch were already discovered, skip it.
        if (A.isEmpty(chunkBundle)) {
            dispatch(
                discoverNetworkBatchThunk({
                    deviceState,
                    network,
                    round: round + 1,
                }),
            );

            return;
        }

        // Take exclusive access to the device and hold it until is the fetching of the descriptors done.
        const deviceAccessResponse = await requestDeviceAccess(() =>
            dispatch(fetchBundleDescriptorsThunk(chunkBundle)).unwrap(),
        );

        if (!deviceAccessResponse.success) {
            return;
        }

        const identity = tryGetAccountIdentity({ deviceState, networkType: network.networkType });

        const isFinished = await dispatch(
            discoverAccountsByDescriptorThunk({
                descriptorsBundle: deviceAccessResponse.payload,
                deviceState,
                identity,
            }),
        ).unwrap();

        if (!isFinished) {
            dispatch(
                discoverNetworkBatchThunk({
                    deviceState,
                    network,
                    round: round + 1,
                }),
            );
        } else {
            dispatch(finishNetworkTypeDiscoveryThunk());
        }
    },
);

export const createDescriptorPreloadedDiscoveryThunk = createThunk(
    `${DISCOVERY_MODULE_PREFIX}/createDescriptorPreloadedDiscoveryThunk`,
    async (
        {
            deviceState,
            supportedNetworks,
        }: {
            deviceState: string;
            supportedNetworks: readonly Network[];
        },
        { dispatch, getState },
    ) => {
        const device = selectDeviceByState(getState(), deviceState);

        if (!device) {
            return;
        }

        const supportedNetworksSymbols = supportedNetworks.map(network => network.symbol);
        const discoveryNetworksTotalCount = supportedNetworksSymbols.length;

        let availableCardanoDerivations: ('normal' | 'legacy' | 'ledger')[] | undefined;
        if (supportedNetworks.some(network => network.networkType === 'cardano')) {
            availableCardanoDerivations = await dispatch(
                getCardanoSupportedAccountTypesThunk({
                    deviceState,
                }),
            ).unwrap();
        }

        dispatch(
            createDiscovery({
                deviceState,
                authConfirm: false,
                index: 0,
                status: DiscoveryStatus.RUNNING,
                total: discoveryNetworksTotalCount,
                bundleSize: 0,
                loaded: 0,
                failed: [],
                availableCardanoDerivations,
                networks: supportedNetworksSymbols,
            }),
        );
    },
);

export const startDescriptorPreloadedDiscoveryThunk = createThunk(
    `${DISCOVERY_MODULE_PREFIX}/startDescriptorPreloadedDiscoveryThunk`,
    async (
        { deviceState, areTestnetsEnabled }: { deviceState: string; areTestnetsEnabled: boolean },
        { dispatch, getState },
    ) => {
        const device = selectDeviceByState(getState(), deviceState);

        const discovery1 = selectDeviceDiscovery(getState());
        if (discovery1) {
            console.warn(
                `Warning discovery for device ${deviceState} already exists. Skipping discovery.`,
            );

            return;
        }

        if (!device) {
            return;
        }

        let supportedNetworks = selectDiscoverySupportedNetworks(getState(), areTestnetsEnabled);
        const enabledNetworkSymbols = selectEnabledDiscoveryNetworkSymbols(getState());
        const isCoinEnablingActive = selectIsFeatureFlagEnabled(
            getState(),
            FeatureFlag.IsCoinEnablingActive,
        );

        // If FF is active, Filter out networks that are not enabled
        if (isCoinEnablingActive) {
            supportedNetworks = supportedNetworks.filter(n =>
                enabledNetworkSymbols.includes(n.symbol),
            );
        }

        // Start tracking duration for analytics purposes
        dispatch(setDiscoveryStartTimestamp(performance.now()));

        await dispatch(
            createDescriptorPreloadedDiscoveryThunk({
                deviceState,
                supportedNetworks,
            }),
        );

        // We need to check again here because it's possible that things changed in the meantime because async thunks
        const discovery2 = selectDeviceDiscovery(getState());
        if (!discovery2) {
            return;
        }

        // Start discovery for every network account type.
        supportedNetworks.forEach(network => {
            dispatch(discoverNetworkBatchThunk({ deviceState, network }));
        });
    },
);
