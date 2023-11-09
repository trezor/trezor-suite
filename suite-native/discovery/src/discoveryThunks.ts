import { A } from '@mobily/ts-belt';

import { createThunk } from '@suite-common/redux-utils';
import { TrezorDevice } from '@suite-common/suite-types';
import {
    accountsActions,
    DISCOVERY_MODULE_PREFIX,
    filterUnavailableNetworks,
    selectDiscoveryForDevice,
    updateDiscovery,
    createDiscovery,
    removeDiscovery,
    getAvailableCardanoDerivationsThunk,
} from '@suite-common/wallet-core';
import { selectIsAccountAlreadyDiscovered } from '@suite-native/accounts';
import TrezorConnect from '@trezor/connect';
import { DiscoveryItem } from '@suite-common/wallet-types';
import { getDerivationType } from '@suite-common/wallet-utils';
import { Network } from '@suite-common/wallet-config';
import { DiscoveryStatus } from '@suite-common/wallet-constants';
import { supportedMainnetSymbols, supportedNetworkSymbols } from '@suite-native/config';

import { DeviceAccessMutex, fetchBundleDescriptors } from './utils';

const DISCOVERY_BATCH_SIZE = 3;

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

        if (finishedNetworksCount === discovery.networks.length) {
            dispatch(removeDiscovery(discovery.deviceState));
        }
    },
);

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
            device,
            round = 1,
            network,
            mutex,
        }: {
            deviceState: string;
            device: TrezorDevice;
            round?: number;
            network: Network;
            mutex: DeviceAccessMutex;
        },
        { dispatch, getState },
    ) => {
        const discovery = selectDiscoveryForDevice(getState());

        if (!discovery || !deviceState) {
            return;
        }

        const accountType = network.accountType || 'normal';

        const lastDiscoveredAccountIndex = (round - 1) * DISCOVERY_BATCH_SIZE;

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

        A.makeWithIndex(DISCOVERY_BATCH_SIZE, index => {
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
                });
            }
        });

        // All accounts of the batch were already discovered, skip it.
        if (A.isEmpty(chunkBundle)) {
            dispatch(
                discoverNetworkBatchThunk({
                    deviceState,
                    device,
                    network,
                    mutex,
                    round: round + 1,
                }),
            );
            return;
        }

        // Take exclusive access to the device and hold it until is the fetching of the descriptors done.
        await mutex.lock();
        const descriptorsBundle = await fetchBundleDescriptors(chunkBundle);
        mutex.unlock();

        const isFinished = await dispatch(
            discoverAccountsByDescriptorThunk({
                descriptorsBundle,
                deviceState,
            }),
        ).unwrap();

        if (!isFinished) {
            dispatch(
                discoverNetworkBatchThunk({
                    deviceState,
                    device,
                    network,
                    mutex,
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
            device,
            areTestnetsEnabled,
        }: { deviceState: string; device: TrezorDevice; areTestnetsEnabled: boolean },
        { dispatch },
    ) => {
        const networks = areTestnetsEnabled ? supportedNetworkSymbols : supportedMainnetSymbols;

        const availableCardanoDerivations = await dispatch(
            getAvailableCardanoDerivationsThunk({
                deviceState,
                device,
                isUseEmptyPassphraseForced: true,
            }),
        ).unwrap();

        dispatch(
            createDiscovery({
                deviceState,
                authConfirm: false,
                index: 0,
                status: DiscoveryStatus.IDLE,
                total: networks.length,
                bundleSize: 0,
                loaded: 0,
                failed: [],
                availableCardanoDerivations,
                networks,
            }),
        );
    },
);

export const startDescriptorPreloadedDiscoveryThunk = createThunk(
    `${DISCOVERY_MODULE_PREFIX}/startDescriptorPreloadedDiscoveryThunk`,
    async (
        {
            deviceState,
            device,
            areTestnetsEnabled,
        }: { deviceState: string; device: TrezorDevice; areTestnetsEnabled: boolean },
        { dispatch, getState },
    ) => {
        const mutex = new DeviceAccessMutex();
        await dispatch(
            createDescriptorPreloadedDiscoveryThunk({
                deviceState,
                device,
                areTestnetsEnabled,
            }),
        );
        const discovery = selectDiscoveryForDevice(getState());

        if (!discovery) {
            return;
        }

        dispatch(
            updateDiscovery({
                ...discovery,
                status: DiscoveryStatus.RUNNING,
            }),
        );

        // Get only device supported networks.
        const networks = filterUnavailableNetworks(discovery.networks, device);

        // Start discovery for every network account type.
        networks.forEach(network => {
            dispatch(discoverNetworkBatchThunk({ deviceState, device, network, mutex }));
        });
    },
);
