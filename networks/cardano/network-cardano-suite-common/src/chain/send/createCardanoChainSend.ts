import { isSupportedCardanoNetwork } from '@trezor/network-cardano-types';
import {
    type ChainNetworkSend,
    type PrecomposedLevelsCardano,
    type PushConnectTransactionDeps,
    createPushConnectTransaction,
    readChainNetworkConfig,
} from '@trezor/network-module-suite-common-types';
import type { NetworkSymbol } from '@trezor/network-module-types';

import {
    type ComposeCardanoFeeLevelsDeps,
    createComposeCardanoFeeLevels,
} from './createComposeCardanoFeeLevels';
import {
    type SignCardanoTransactionDeps,
    createSignCardanoTransaction,
} from './createSignCardanoTransaction';
import { getAccountSyncInterval, getNetworkConfig } from '../../networkConfig';

export type CardanoChainSendDeps = ComposeCardanoFeeLevelsDeps &
    SignCardanoTransactionDeps &
    PushConnectTransactionDeps;

/** The send of one Cardano network, by symbol. */
export type CardanoChainSend = (
    symbol: NetworkSymbol,
) => ChainNetworkSend<PrecomposedLevelsCardano>;

/** Composing, signing and broadcasting on a Cardano network. */
export const createCardanoChainSend = (deps: CardanoChainSendDeps): CardanoChainSend => {
    const composeFeeLevels = createComposeCardanoFeeLevels(deps);
    const sign = createSignCardanoTransaction(deps);
    const push = createPushConnectTransaction(deps);

    return symbol => {
        const { decimals, isTestnet } = readChainNetworkConfig(
            {
                isSupportedNetwork: isSupportedCardanoNetwork,
                getNetworkConfig,
                getAccountSyncInterval,
            },
            symbol,
        );
        const config = { decimals, isTestnet };

        return {
            composeFeeLevels: params => composeFeeLevels({ ...params, config }),
            sign: params => sign({ ...params, config }),
            push: params => push({ ...params, useConnectionIdentity: false }),
        };
    };
};
