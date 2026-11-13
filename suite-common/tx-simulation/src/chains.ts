import { type TransactionScanSupportedChain } from '@blockaid/client/resources/evm';
import { type MessageScanParams } from '@blockaid/client/resources/solana/message';
import { type TransactionScanParams as StellarScanParams } from '@blockaid/client/resources/stellar/transaction';

import {
    type Network,
    type NetworkConfig,
    getNetwork,
    getNetworkByEvmChainId,
} from '@suite-common/wallet-config';
import type { SolanaNetworkSymbol } from '@trezor/network-solana-types';
import type { StellarNetworkSymbol } from '@trezor/network-stellar-types';

type EvmChainId = Extract<NetworkConfig, { networkType: 'ethereum' }>['chainId'];
type BlockaidSolanaChain = NonNullable<MessageScanParams['chain']>;
type BlockaidStellarChain = StellarScanParams['chain'];

const BLOCKAID_EVM_CHAIN_BY_CHAIN_ID = {
    [getNetwork('eth').chainId]: 'ethereum',
    [getNetwork('op').chainId]: 'optimism',
    [getNetwork('bsc').chainId]: 'bsc',
    [getNetwork('pol').chainId]: 'polygon',
    [getNetwork('base').chainId]: 'base',
    [getNetwork('arb').chainId]: 'arbitrum',
    [getNetwork('rhc').chainId]: 'robinhood',
    [getNetwork('hype').chainId]: 'hyperevm',
    [getNetwork('avax').chainId]: 'avalanche',
    [getNetwork('tsep').chainId]: 'ethereum-sepolia',
    // Blockaid has no Ethereum Classic chain; the old 'ethereumClassic' value is rejected.
    [getNetwork('etc').chainId]: null,
    [getNetwork('thod').chainId]: null, // Hoodi is not a supported testnet
    [getNetwork('arc').chainId]: null, // Blockaid has no Arc chain
    [getNetwork('tarc').chainId]: null, // Blockaid has no Arc chain
} as const satisfies Readonly<Record<EvmChainId, TransactionScanSupportedChain | null>>;

const BLOCKAID_SOLANA_CHAIN_BY_SYMBOL = {
    sol: 'mainnet',
    dsol: 'devnet',
} as const satisfies Readonly<Record<SolanaNetworkSymbol, BlockaidSolanaChain>>;

const BLOCKAID_STELLAR_CHAIN_BY_SYMBOL = {
    xlm: 'pubnet',
    txlm: 'testnet',
} as const satisfies Readonly<Record<StellarNetworkSymbol, BlockaidStellarChain>>;

// Blockaid accepts a chain ID in place of its chain name.
type BlockaidEvmChain = TransactionScanSupportedChain | (string & {});

export const resolveBlockaidEvmChain = (
    chainId: number | undefined = getNetwork('eth').chainId,
): BlockaidEvmChain | null => {
    if (chainId in BLOCKAID_EVM_CHAIN_BY_CHAIN_ID) {
        return BLOCKAID_EVM_CHAIN_BY_CHAIN_ID[chainId] ?? null;
    }

    // A user-added network is scanned by its chain ID; Blockaid rejects the ones it does not cover.
    return getNetworkByEvmChainId(chainId) ? `0x${chainId.toString(16)}` : null;
};

export const resolveBlockaidSolanaChain = (symbol: SolanaNetworkSymbol) =>
    BLOCKAID_SOLANA_CHAIN_BY_SYMBOL[symbol];

export const resolveBlockaidStellarChain = (symbol: StellarNetworkSymbol) =>
    BLOCKAID_STELLAR_CHAIN_BY_SYMBOL[symbol];

export const getNetworkByBlockaidChain = (chain: string): Network | undefined => {
    const entry = Object.entries(BLOCKAID_EVM_CHAIN_BY_CHAIN_ID).find(
        ([, blockaidChain]) => blockaidChain === chain,
    );

    return entry ? getNetworkByEvmChainId(Number(entry[0])) : undefined;
};
