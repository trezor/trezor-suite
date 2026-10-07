import { isSupportedBitcoinNetwork } from '@trezor/network-bitcoin-types';
import {
    type ChainNetworkSend,
    type PrecomposedLevels,
    type PushConnectTransactionDeps,
    createPushConnectTransaction,
} from '@trezor/network-module-suite-common-types';
import type { NetworkSymbol } from '@trezor/network-module-types';

import {
    type ComposeBitcoinFeeLevelsDeps,
    createComposeBitcoinFeeLevels,
} from './createComposeBitcoinFeeLevels';
import {
    type SignBitcoinTransactionDeps,
    createSignBitcoinTransaction,
} from './createSignBitcoinTransaction';
import type { BitcoinSendConfig } from './types';
import { getNetworkConfig } from '../../networkConfig';
import { getBitcoinChainNetworkConfig } from '../getBitcoinChainNetworkConfig';

export type BitcoinChainSendDeps = ComposeBitcoinFeeLevelsDeps &
    SignBitcoinTransactionDeps &
    PushConnectTransactionDeps;

/** The send of one Bitcoin-like network, by symbol. */
export type BitcoinChainSend = (symbol: NetworkSymbol) => ChainNetworkSend<PrecomposedLevels>;

const getAccountFeatureCheck =
    (symbol: NetworkSymbol): BitcoinSendConfig['hasAccountFeature'] =>
    (accountType, feature) => {
        if (!isSupportedBitcoinNetwork(symbol)) return false;

        const network = getNetworkConfig(symbol);
        const features = network.accountTypes[accountType]?.features ?? network.features;

        return features.includes(feature);
    };

/** Composing, signing and broadcasting on a Bitcoin-like network. */
export const createBitcoinChainSend = (deps: BitcoinChainSendDeps): BitcoinChainSend => {
    const composeFeeLevels = createComposeBitcoinFeeLevels(deps);
    const sign = createSignBitcoinTransaction(deps);
    const push = createPushConnectTransaction(deps);

    return symbol => {
        const config: BitcoinSendConfig = {
            decimals: getBitcoinChainNetworkConfig(symbol).decimals,
            hasAccountFeature: getAccountFeatureCheck(symbol),
        };

        return {
            composeFeeLevels: params => composeFeeLevels({ ...params, config }),
            sign: params => sign({ ...params, config }),
            push: params => push({ ...params, useConnectionIdentity: false }),
        };
    };
};
