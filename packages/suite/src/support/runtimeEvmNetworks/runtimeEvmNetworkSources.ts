import {
    Feature,
    type MessageSystemRootState,
    selectFeatureConfig,
    validateRuntimeEvmNetworksPayload,
} from '@suite-common/message-system';
import { createWeakMapSelector } from '@suite-common/redux-utils';
import { networksCollection } from '@suite-common/wallet-config';
import type { RuntimeEvmNetworkReservations } from '@trezor/network-ethereum-suite-common';

const NO_ENTRIES: readonly unknown[] = [];

/** A runtime network may not take the symbol or chain ID of a network built into the app. */
export const BUILT_IN_NETWORK_RESERVATIONS: RuntimeEvmNetworkReservations = {
    reservedSymbols: new Set(networksCollection.map(({ symbol }) => symbol)),
    reservedChainIds: new Set(
        networksCollection.flatMap(({ chainId }) => (chainId === undefined ? [] : [chainId])),
    ),
};

const getListedEntries = (payload: unknown): readonly unknown[] => {
    try {
        return validateRuntimeEvmNetworksPayload(payload).networks ?? NO_ENTRIES;
    } catch {
        return NO_ENTRIES;
    }
};

/**
 * Entries of Trezor's signed list of runtime EVM networks, while the list is switched on. They are
 * checked one by one by the registry. The same reference while the signed config is unchanged.
 */
export const selectTrezorListedRuntimeEvmNetworks =
    createWeakMapSelector.withTypes<MessageSystemRootState>()(
        [
            (state: MessageSystemRootState) =>
                selectFeatureConfig(state, Feature.networks.evmRuntime),
        ],
        featureConfig =>
            featureConfig?.flag ? getListedEntries(featureConfig.payload) : NO_ENTRIES,
    );
