import { type TransactionScanSupportedChain } from '@blockaid/client/resources/evm';

import {
    type Network,
    type NetworkConfig,
    type NetworkSymbol,
    getNetwork,
    getNetworkByEvmChainId,
    networks,
} from '@suite-common/wallet-config';

type EvmChainId = Extract<NetworkConfig, { networkType: 'ethereum' }>['chainId'];

const BLOCKAID_EVM_CHAIN_BY_CHAIN_ID = {
    [networks.eth.chainId]: 'ethereum',
    [networks.op.chainId]: 'optimism',
    [networks.bsc.chainId]: 'bsc',
    [networks.pol.chainId]: 'polygon',
    [networks.base.chainId]: 'base',
    [networks.arb.chainId]: 'arbitrum',
    [networks.rhc.chainId]: 'robinhood',
    [networks.hype.chainId]: 'hyperevm',
    [networks.avax.chainId]: 'avalanche',
    [networks.tsep.chainId]: 'ethereum-sepolia',
    // Blockaid has no Ethereum Classic chain; the old 'ethereumClassic' value is rejected.
    [networks.etc.chainId]: null,
    [networks.thod.chainId]: null, // Hoodi is not a supported testnet
} as const satisfies Readonly<Record<EvmChainId, TransactionScanSupportedChain | null>>;

export const resolveBlockaidEvmChain = (chainId: number | undefined = networks.eth.chainId) =>
    BLOCKAID_EVM_CHAIN_BY_CHAIN_ID[chainId as EvmChainId] ?? null;

export const getNetworkByBlockaidChain = (chain: string): Network | undefined => {
    const entry = Object.entries(BLOCKAID_EVM_CHAIN_BY_CHAIN_ID).find(
        ([, blockaidChain]) => blockaidChain === chain,
    );

    return entry ? getNetworkByEvmChainId(Number(entry[0])) : undefined;
};

export const isBlockaidSupportedNetwork = (symbol: NetworkSymbol): boolean => {
    const network = getNetwork(symbol);

    return network.networkType === 'ethereum' && resolveBlockaidEvmChain(network.chainId) !== null;
};
