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
import { isHex } from '@trezor/utils';

/** A chain Blockaid names, or any other chain as its hex id. */
export type BlockaidEvmChain = TransactionScanSupportedChain | `0x${string}`;

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
    [getNetwork('arc').chainId]: 'arc',
    [getNetwork('tsep').chainId]: 'ethereum-sepolia',
    // Blockaid has no Ethereum Classic chain; the old 'ethereumClassic' value is rejected.
    [getNetwork('etc').chainId]: null,
    [getNetwork('thod').chainId]: null, // Hoodi is not a supported testnet
    [getNetwork('tarc').chainId]: null, // Blockaid has no Arc testnet chain
} as const satisfies Readonly<Record<EvmChainId, TransactionScanSupportedChain | null>>;

const BLOCKAID_SOLANA_CHAIN_BY_SYMBOL = {
    sol: 'mainnet',
    dsol: 'devnet',
} as const satisfies Readonly<Record<SolanaNetworkSymbol, BlockaidSolanaChain>>;

const BLOCKAID_STELLAR_CHAIN_BY_SYMBOL = {
    xlm: 'pubnet',
    txlm: 'testnet',
} as const satisfies Readonly<Record<StellarNetworkSymbol, BlockaidStellarChain>>;

const HEX_CHAIN_ID_PREFIX = '0x';

const getHexChainId = (chainId: number): BlockaidEvmChain =>
    `${HEX_CHAIN_ID_PREFIX}${chainId.toString(16)}`;

// Chain ids Blockaid rejected in this session, so their transactions are not sent to it again.
const unsupportedHexChainIds = new Set<number>();

export const isHexBlockaidChain = (chain: string) => chain.startsWith(HEX_CHAIN_ID_PREFIX);

export const markBlockaidChainUnsupported = (chain: string) => {
    if (isHexBlockaidChain(chain)) {
        unsupportedHexChainIds.add(Number(chain));
    }
};

/**
 * A named chain wins, so the bundled networks keep the chains Blockaid reports back in cross-chain
 * diffs. A user-added network is scanned by its hex id until Blockaid rejects it.
 */
export const resolveBlockaidEvmChain = (
    chainId: number | undefined = getNetwork('eth').chainId,
): BlockaidEvmChain | null => {
    if (chainId in BLOCKAID_EVM_CHAIN_BY_CHAIN_ID) {
        return BLOCKAID_EVM_CHAIN_BY_CHAIN_ID[chainId] ?? null;
    }

    return getNetworkByEvmChainId(chainId) && !unsupportedHexChainIds.has(chainId)
        ? getHexChainId(chainId)
        : null;
};

export const resolveBlockaidSolanaChain = (symbol: SolanaNetworkSymbol) =>
    BLOCKAID_SOLANA_CHAIN_BY_SYMBOL[symbol];

export const resolveBlockaidStellarChain = (symbol: StellarNetworkSymbol) =>
    BLOCKAID_STELLAR_CHAIN_BY_SYMBOL[symbol];

export const getNetworkByBlockaidChain = (chain: string): Network | undefined => {
    if (chain.startsWith(HEX_CHAIN_ID_PREFIX)) {
        if (!isHex(chain, { allowEmpty: false })) {
            return undefined;
        }

        const chainId = Number(chain);

        return Number.isSafeInteger(chainId) ? getNetworkByEvmChainId(chainId) : undefined;
    }

    const entry = Object.entries(BLOCKAID_EVM_CHAIN_BY_CHAIN_ID).find(
        ([, blockaidChain]) => blockaidChain === chain,
    );

    return entry ? getNetworkByEvmChainId(Number(entry[0])) : undefined;
};
