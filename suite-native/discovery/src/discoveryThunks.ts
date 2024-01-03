import { A, pipe } from '@mobily/ts-belt';

import { createThunk } from '@suite-common/redux-utils';
import {
    accountsActions,
    DISCOVERY_MODULE_PREFIX,
    selectDeviceAccountsLengthPerNetwork,
    selectDiscoveryForDevice,
    updateDiscovery,
    createDiscovery,
    removeDiscovery,
    getAvailableCardanoDerivationsThunk,
    selectDeviceByState,
    selectSupportedNetworks,
    filterUnavailableNetworks,
} from '@suite-common/wallet-core';
import { selectIsAccountAlreadyDiscovered } from '@suite-native/accounts';
import TrezorConnect from '@trezor/connect';
import { DiscoveryItem } from '@suite-common/wallet-types';
import { getDerivationType, getNetwork } from '@suite-common/wallet-utils';
import { Network, NetworkSymbol } from '@suite-common/wallet-config';
import { DiscoveryStatus } from '@suite-common/wallet-constants';
import { filterTestnetNetworks, sortNetworks } from '@suite-native/config';
import { requestDeviceAccess } from '@suite-native/device-mutex';
import { analytics, EventType } from '@suite-native/analytics';

import { fetchBundleDescriptors } from './utils';
import { selectDiscoveryStartTimeStamp, setDiscoveryStartTimestamp } from './discoveryConfigSlice';

const DISCOVERY_DEFAULT_BATCH_SIZE = 2;

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

const finishNetworkTypeDiscoveryThunk = createThunk(
    `${DISCOVERY_MODULE_PREFIX}/finishNetworkTypeDiscoveryThunk`,
    (_, { dispatch, getState }) => {
        const discovery = selectDiscoveryForDevice(getState());

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

            const discoveryStartTime = selectDiscoveryStartTimeStamp(getState());
            // Discovery analytics duration tracking
            if (discoveryStartTime !== null) {
                const endTime = performance.now();
                const duration = endTime - discoveryStartTime;
                const accountsMap = selectDeviceAccountsLengthPerNetwork(getState());

                analytics.report({
                    type: EventType.CoinDiscovery,
                    payload: { ...accountsMap, loadDuration: duration },
                });
                dispatch(setDiscoveryStartTimestamp(null));
            }
        }
    },
);

const getDetailsLevels = (coin: NetworkSymbol) => {
    const network = getNetwork(coin);
    // For Cardano we need to fetch at least one tx otherwise it will not generate correctly new receive addresses (xpub instead of address)
    if (network?.networkType === 'cardano') return { details: 'txs', pageSize: 1 } as const;
    return { details: 'tokens' } as const;
};

const discoverAccountsByDescriptorThunk = createThunk(
    `${DISCOVERY_MODULE_PREFIX}/discoverAccountsByDescriptorThunk`,
    async (
        {
            descriptorsBundle,
            deviceState,
        }: {
            descriptorsBundle: DiscoveryDescriptorItem[];
            deviceState: string;
        },
        { dispatch },
    ) => {
        let isFinalRound = false;

        if (A.isEmpty(descriptorsBundle)) {
            isFinalRound = true;
        }

        // eslint-disable-next-line no-restricted-syntax
        for (const bundleItem of descriptorsBundle) {
            // eslint-disable-next-line no-await-in-loop
            const { success, payload: accountInfo } = await TrezorConnect.getAccountInfo({
                coin: bundleItem.coin,
                descriptor: bundleItem.descriptor,
                useEmptyPassphrase: true,
                skipFinalReload: true,
                ...getDetailsLevels(bundleItem.coin),
            });

            if (success) {
                if (accountInfo.empty) {
                    isFinalRound = true;
                    break;
                }

                dispatch(
                    accountsActions.createIndexLabeledAccount({
                        discoveryItem: bundleItem,
                        deviceState,
                        accountInfo,
                    }),
                );
            }
        }

        return isFinalRound;
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
        const discovery = selectDiscoveryForDevice(getState());
        const batchSize = getBatchSizeByCoin(network.symbol);

        if (!discovery || !deviceState) {
            return;
        }

        const accountType = network.accountType || 'normal';

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

        A.makeWithIndex(batchSize, index => {
            const accountPath = network.bip43Path.replace(
                'i',
                (lastDiscoveredAccountIndex + index).toString(),
            );

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
        const deviceAccessResponse = await requestDeviceAccess(fetchBundleDescriptors, chunkBundle);

        if (!deviceAccessResponse.success) {
            return;
        }

        const isFinished = await dispatch(
            discoverAccountsByDescriptorThunk({
                descriptorsBundle: deviceAccessResponse.payload,
                deviceState,
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

        let availableCardanoDerivationsResponse;
        if (supportedNetworks.some(network => network.networkType === 'cardano')) {
            availableCardanoDerivationsResponse = await requestDeviceAccess(() =>
                dispatch(getAvailableCardanoDerivationsThunk({ deviceState, device })).unwrap(),
            );

            if (!availableCardanoDerivationsResponse.success) return false;
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
                availableCardanoDerivations: availableCardanoDerivationsResponse?.payload,
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

        const discovery1 = selectDiscoveryForDevice(getState());
        if (discovery1) {
            console.warn(
                `Warning discovery for device ${deviceState} already exists. Skipping discovery.`,
            );
            return;
        }

        if (!device) {
            return;
        }

        const supportedNetworks = pipe(
            selectSupportedNetworks(getState()),
            networkSymbols => filterTestnetNetworks(networkSymbols, areTestnetsEnabled),
            filterUnavailableNetworks,
            sortNetworks,
        );

        // Start tracking duration for analytics purposes
        dispatch(setDiscoveryStartTimestamp(performance.now()));

        await dispatch(
            createDescriptorPreloadedDiscoveryThunk({
                deviceState,
                supportedNetworks,
            }),
        );

        // We need to check again here because it's possible that things changed in the meantime because async thunks
        const discovery2 = selectDiscoveryForDevice(getState());
        if (!discovery2) {
            return;
        }

        // Start discovery for every network account type.
        supportedNetworks.forEach(network => {
            dispatch(discoverNetworkBatchThunk({ deviceState, network }));
        });
    },
);
