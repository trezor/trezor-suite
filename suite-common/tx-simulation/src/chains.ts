import { type TransactionScanSupportedChain } from '@blockaid/client/resources/evm';
import { type MessageScanParams } from '@blockaid/client/resources/solana/message';
import { type TransactionScanParams as StellarScanParams } from '@blockaid/client/resources/stellar/transaction';

import {
    type Network,
    type NetworkConfig,
    getNetworkByEvmChainId,
    networks,
} from '@suite-common/wallet-config';
import { type SolanaNetworkSymbol } from '@trezor/network-solana/constants';
import { type StellarNetworkSymbol } from '@trezor/network-stellar/constants';

type EvmChainId = Extract<NetworkConfig, { networkType: 'ethereum' }>['chainId'];
type BlockaidSolanaChain = NonNullable<MessageScanParams['chain']>;
type BlockaidStellarChain = StellarScanParams['chain'];

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

const BLOCKAID_SOLANA_CHAIN_BY_SYMBOL = {
    sol: 'mainnet',
    dsol: 'devnet',
} as const satisfies Readonly<Record<SolanaNetworkSymbol, BlockaidSolanaChain>>;

const BLOCKAID_STELLAR_CHAIN_BY_SYMBOL = {
    xlm: 'pubnet',
    txlm: 'testnet',
} as const satisfies Readonly<Record<StellarNetworkSymbol, BlockaidStellarChain>>;

export const resolveBlockaidEvmChain = (chainId: number | undefined = networks.eth.chainId) =>
    BLOCKAID_EVM_CHAIN_BY_CHAIN_ID[chainId as EvmChainId] ?? null;

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
