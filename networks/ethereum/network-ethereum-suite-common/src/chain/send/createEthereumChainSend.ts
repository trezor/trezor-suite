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
    type ConnectEstimateEvmGasLimitDeps,
    createConnectEstimateEvmGasLimit,
} from './createConnectEstimateEvmGasLimit';
import { type EvmChainSendDeps, createEvmChainSend } from './createEvmChainSend';

export type EthereumChainSendDeps = Omit<EvmChainSendDeps, 'estimateEvmGasLimit' | 'push'> &
    ConnectEstimateEvmGasLimitDeps &
    PushConnectTransactionDeps;

/** The send of one EVM network, by symbol. */
export type EthereumChainSend = (
    symbol: NetworkSymbol,
) => ChainNetworkSendDefinition<PrecomposedLevels>;

/**
 * Composing, signing and broadcasting on an EVM network Connect serves. Backends keep one
 * connection per wallet, so every call goes through the account's connection identity.
 */
export const createEthereumChainSend = (deps: EthereumChainSendDeps): EthereumChainSend => {
    const pushConnectTransaction = createPushConnectTransaction(deps);
    const createSend = createEvmChainSend({
        ...deps,
        estimateEvmGasLimit: createConnectEstimateEvmGasLimit(deps),
        push: params => pushConnectTransaction({ ...params, useConnectionIdentity: true }),
    });

    return symbol => {
        const { decimals, nativeAsset, nativeTokenReserve } = getEthereumChainNetworkConfig(symbol);

        return createSend({
            decimals,
            displaySymbol: nativeAsset.symbol,
            nativeTokenReserve,
            chainId: isSupportedEthereumNetwork(symbol)
                ? getNetworkConfig(symbol).chainId
                : undefined,
        });
    };
};
