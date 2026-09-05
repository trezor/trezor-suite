import type { TransactionScanSupportedChain } from '@blockaid/client/resources/evm';

import {
    type EthereumNetworkSymbol,
    supportedEthereumNetworks,
} from '@trezor/network-ethereum/constants';
import type { NetworkChainId } from '@trezor/network-module-suite-common-types';

import { networkConfigBySymbol } from './networkConfig';

const BLOCKAID_EVM_CHAIN_BY_CHAIN_ID: Readonly<
    Record<NetworkChainId, TransactionScanSupportedChain | null>
> = {
    [networkConfigBySymbol.eth.chainId]: 'ethereum',
    [networkConfigBySymbol.op.chainId]: 'optimism',
    [networkConfigBySymbol.bsc.chainId]: 'bsc',
    [networkConfigBySymbol.pol.chainId]: 'polygon',
    [networkConfigBySymbol.base.chainId]: 'base',
    [networkConfigBySymbol.arb.chainId]: 'arbitrum',
    [networkConfigBySymbol.rhc.chainId]: 'robinhood',
    [networkConfigBySymbol.hype.chainId]: 'hyperevm',
    [networkConfigBySymbol.avax.chainId]: 'avalanche',
    [networkConfigBySymbol.tsep.chainId]: 'ethereum-sepolia',
    // Blockaid has no Ethereum Classic chain; the old 'ethereumClassic' value is rejected.
    [networkConfigBySymbol.etc.chainId]: null,
    [networkConfigBySymbol.thod.chainId]: null, // Hoodi is not a supported testnet
};

export const resolveBlockaidEvmChain = (
    chainId: NetworkChainId = networkConfigBySymbol.eth.chainId,
) => BLOCKAID_EVM_CHAIN_BY_CHAIN_ID[chainId] ?? null;

export const findEthereumNetworkSymbolByBlockaidChain = (
    blockaidChain: string,
): EthereumNetworkSymbol | null =>
    supportedEthereumNetworks.find(
        symbol => resolveBlockaidEvmChain(networkConfigBySymbol[symbol].chainId) === blockaidChain,
    ) ?? null;
