import {
    type ChainNetworkSend,
    type PrecomposedLevels,
    type PushConnectTransactionDeps,
    createPushConnectTransaction,
    readChainNetworkConfig,
} from '@trezor/network-module-suite-common-types';
import type { NetworkSymbol } from '@trezor/network-module-types';
import { isSupportedTronNetwork } from '@trezor/network-tron-types';

import {
    type ComposeTronFeeLevelsDeps,
    createComposeTronFeeLevels,
} from './createComposeTronFeeLevels';
import {
    type SignTronTransactionDeps,
    createSignTronTransaction,
} from './createSignTronTransaction';
import { getAccountSyncInterval, getNetworkConfig } from '../../networkConfig';

export type TronChainSendDeps = ComposeTronFeeLevelsDeps &
    SignTronTransactionDeps &
    PushConnectTransactionDeps;

/** The send of one Tron network, by symbol. */
export type TronChainSend = (symbol: NetworkSymbol) => ChainNetworkSend<PrecomposedLevels>;

/** Composing, signing and broadcasting on a Tron network. */
export const createTronChainSend = (deps: TronChainSendDeps): TronChainSend => {
    const composeFeeLevels = createComposeTronFeeLevels(deps);
    const sign = createSignTronTransaction(deps);
    const push = createPushConnectTransaction(deps);

    return symbol => {
        const { decimals, nativeAsset } = readChainNetworkConfig(
            {
                isSupportedNetwork: isSupportedTronNetwork,
                getNetworkConfig,
                getAccountSyncInterval,
            },
            symbol,
        );
        const config = { decimals, displaySymbol: nativeAsset.symbol };

        return {
            composeFeeLevels: params => composeFeeLevels({ ...params, config }),
            sign: params => sign({ ...params, config }),
            push: params => push({ ...params, useConnectionIdentity: false }),
        };
    };
};
