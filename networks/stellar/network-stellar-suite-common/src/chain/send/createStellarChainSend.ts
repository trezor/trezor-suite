import {
    type ChainNetworkSend,
    type PrecomposedLevels,
    type PushConnectTransactionDeps,
    createPushConnectTransaction,
    readChainNetworkConfig,
} from '@trezor/network-module-suite-common-types';
import type { NetworkSymbol } from '@trezor/network-module-types';
import { isSupportedStellarNetwork } from '@trezor/network-stellar-types';

import {
    type ComposeStellarFeeLevelsDeps,
    createComposeStellarFeeLevels,
} from './createComposeStellarFeeLevels';
import {
    type SignStellarTransactionDeps,
    createSignStellarTransaction,
} from './createSignStellarTransaction';
import { getAccountSyncInterval, getNetworkConfig } from '../../networkConfig';

export type StellarChainSendDeps = ComposeStellarFeeLevelsDeps &
    SignStellarTransactionDeps &
    PushConnectTransactionDeps;

/** The send of one Stellar network, by symbol. */
export type StellarChainSend = (symbol: NetworkSymbol) => ChainNetworkSend<PrecomposedLevels>;

/** Composing, signing and broadcasting on a Stellar network. */
export const createStellarChainSend = (deps: StellarChainSendDeps): StellarChainSend => {
    const composeFeeLevels = createComposeStellarFeeLevels(deps);
    const sign = createSignStellarTransaction(deps);
    const push = createPushConnectTransaction(deps);

    return symbol => {
        const { decimals, isTestnet, nativeAsset } = readChainNetworkConfig(
            {
                isSupportedNetwork: isSupportedStellarNetwork,
                getNetworkConfig,
                getAccountSyncInterval,
            },
            symbol,
        );
        const config = { decimals, isTestnet, displaySymbol: nativeAsset.symbol };

        return {
            composeFeeLevels: params => composeFeeLevels({ ...params, config }),
            sign: params => sign({ ...params, config }),
            push: params => push({ ...params, useConnectionIdentity: false }),
        };
    };
};
