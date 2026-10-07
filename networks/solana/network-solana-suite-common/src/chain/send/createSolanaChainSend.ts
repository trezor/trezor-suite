import {
    type ChainNetworkSendDefinition,
    type PrecomposedLevels,
    type PushConnectTransactionDeps,
    createPushConnectTransaction,
    readChainNetworkConfig,
} from '@trezor/network-module-suite-common-types';
import type { NetworkSymbol } from '@trezor/network-module-types';
import { isSupportedSolanaNetwork } from '@trezor/network-solana-types';

import {
    type ComposeSolanaFeeLevelsDeps,
    createComposeSolanaFeeLevels,
} from './createComposeSolanaFeeLevels';
import {
    type SignSolanaTransactionDeps,
    createSignSolanaTransaction,
} from './createSignSolanaTransaction';
import { getAccountSyncInterval, getNetworkConfig } from '../../networkConfig';

export type SolanaChainSendDeps = ComposeSolanaFeeLevelsDeps &
    SignSolanaTransactionDeps &
    PushConnectTransactionDeps;

/** The send of one Solana network, by symbol. */
export type SolanaChainSend = (
    symbol: NetworkSymbol,
) => ChainNetworkSendDefinition<PrecomposedLevels>;

/** Composing, signing and broadcasting on a Solana network. */
export const createSolanaChainSend = (deps: SolanaChainSendDeps): SolanaChainSend => {
    const composeFeeLevels = createComposeSolanaFeeLevels(deps);
    const sign = createSignSolanaTransaction(deps);
    const push = createPushConnectTransaction(deps);

    return symbol => {
        const { decimals, nativeAsset, nativeTokenReserve } = readChainNetworkConfig(
            {
                isSupportedNetwork: isSupportedSolanaNetwork,
                getNetworkConfig,
                getAccountSyncInterval,
            },
            symbol,
        );
        const config = { decimals, displaySymbol: nativeAsset.symbol, nativeTokenReserve };

        return {
            composeFeeLevels: params => composeFeeLevels({ ...params, config }),
            sign,
            push: params => push({ ...params, useConnectionIdentity: false }),
        };
    };
};
