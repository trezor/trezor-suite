import { isSupportedEthereumNetwork } from '@trezor/network-ethereum-types';
import {
    type ChainNetworkSendDefinition,
    type PrecomposedLevels,
    type PushConnectTransactionDeps,
    createPushConnectTransaction,
} from '@trezor/network-module-suite-common-types';
import type { NetworkSymbol } from '@trezor/network-module-types';

import { getNetworkConfig } from '../../networkConfig';
import { getEthereumChainNetworkConfig } from '../getEthereumChainNetworkConfig';
import {
    type ComposeEvmFeeLevelsDeps,
    createComposeEvmFeeLevels,
} from './createComposeEvmFeeLevels';
import { type SignEvmTransactionDeps, createSignEvmTransaction } from './createSignEvmTransaction';

export type EthereumChainSendDeps = ComposeEvmFeeLevelsDeps &
    SignEvmTransactionDeps &
    PushConnectTransactionDeps;

/** The send of one EVM network, by symbol. */
export type EthereumChainSend = (
    symbol: NetworkSymbol,
) => ChainNetworkSendDefinition<PrecomposedLevels>;

/**
 * Composing, signing and broadcasting on an EVM network. Backends keep one connection per wallet,
 * so every call goes through the account's connection identity.
 */
export const createEthereumChainSend = (deps: EthereumChainSendDeps): EthereumChainSend => {
    const composeFeeLevels = createComposeEvmFeeLevels(deps);
    const sign = createSignEvmTransaction(deps);
    const push = createPushConnectTransaction(deps);

    return symbol => {
        const { decimals, nativeAsset, nativeTokenReserve } = getEthereumChainNetworkConfig(symbol);
        const config = {
            decimals,
            displaySymbol: nativeAsset.symbol,
            nativeTokenReserve,
            chainId: isSupportedEthereumNetwork(symbol)
                ? getNetworkConfig(symbol).chainId
                : undefined,
        };

        return {
            composeFeeLevels: params => composeFeeLevels({ ...params, config }),
            sign: params => sign({ ...params, config }),
            push: params => push({ ...params, useConnectionIdentity: true }),
        };
    };
};
