import {
    type ChainNetworkSend,
    type PrecomposedLevels,
    type PushConnectTransactionDeps,
    createPushConnectTransaction,
    readChainNetworkConfig,
} from '@trezor/network-module-suite-common-types';
import type { NetworkSymbol } from '@trezor/network-module-types';
import { isSupportedRippleNetwork } from '@trezor/network-ripple-types';

import {
    type ComposeRippleFeeLevelsDeps,
    createComposeRippleFeeLevels,
} from './createComposeRippleFeeLevels';
import {
    type SignRippleTransactionDeps,
    createSignRippleTransaction,
} from './createSignRippleTransaction';
import { getAccountSyncInterval, getNetworkConfig } from '../../networkConfig';

export type RippleChainSendDeps = ComposeRippleFeeLevelsDeps &
    SignRippleTransactionDeps &
    PushConnectTransactionDeps;

/** The send of one XRP Ledger network, by symbol. */
export type RippleChainSend = (symbol: NetworkSymbol) => ChainNetworkSend<PrecomposedLevels>;

/** Composing, signing and broadcasting on an XRP Ledger network. */
export const createRippleChainSend = (deps: RippleChainSendDeps): RippleChainSend => {
    const composeFeeLevels = createComposeRippleFeeLevels(deps);
    const sign = createSignRippleTransaction(deps);
    const push = createPushConnectTransaction(deps);

    return symbol => {
        const { decimals, nativeAsset } = readChainNetworkConfig(
            {
                isSupportedNetwork: isSupportedRippleNetwork,
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
