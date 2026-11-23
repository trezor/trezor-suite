import { type TransactionScanSupportedChain } from '@blockaid/client/resources/evm';
import { type MessageScanParams } from '@blockaid/client/resources/solana/message';
import { type TransactionScanParams as StellarScanParams } from '@blockaid/client/resources/stellar/transaction';

import { type EvmNetwork, findEvmNetworkByChainId } from '@suite-common/evm-networks-api';
import {
    type Network,
    type NetworkConfig,
    getNetwork,
    getNetworkByEvmChainId,
} from '@suite-common/wallet-config';
import type { SolanaNetworkSymbol } from '@trezor/network-solana-types';
import type { StellarNetworkSymbol } from '@trezor/network-stellar-types';

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
// `parseInt` would read `0x1zz` as chain 1, so the whole id must be hex digits.
const HEX_CHAIN_ID_PATTERN = /^0x[0-9a-f]+$/i;

const getHexChainId = (chainId: number): BlockaidEvmChain =>
    `${HEX_CHAIN_ID_PREFIX}${chainId.toString(16)}`;

const isUserAddedEvmChain = (chainId: number) =>
    !(chainId in BLOCKAID_EVM_CHAIN_BY_CHAIN_ID) && getNetworkByEvmChainId(chainId) !== undefined;

/**
 * A named chain wins, so the bundled networks keep the chains Blockaid reports back in cross-chain
 * diffs. Any other chain is scanned by its hex id once the EVM networks service says Blockaid
 * supports it, which overrides the chains mapped to `null` above. A user-added network is scanned
 * even when the service does not list it; Blockaid rejects a chain it does not cover.
 */
export const resolveBlockaidEvmChain = (
    chainId: number | undefined = getNetwork('eth').chainId,
    evmNetworks?: readonly EvmNetwork[],
): BlockaidEvmChain | null => {
    const namedChain: TransactionScanSupportedChain | null =
        BLOCKAID_EVM_CHAIN_BY_CHAIN_ID[chainId] ?? null;

    if (namedChain !== null) {
        return namedChain;
    }

    const isSimulatedByService =
        findEvmNetworkByChainId(evmNetworks, chainId)?.simulationSupport === true;

    return isSimulatedByService || isUserAddedEvmChain(chainId) ? getHexChainId(chainId) : null;
};

export const resolveBlockaidSolanaChain = (symbol: SolanaNetworkSymbol) =>
    BLOCKAID_SOLANA_CHAIN_BY_SYMBOL[symbol];

export const resolveBlockaidStellarChain = (symbol: StellarNetworkSymbol) =>
    BLOCKAID_STELLAR_CHAIN_BY_SYMBOL[symbol];

export const getNetworkByBlockaidChain = (chain: string): Network | undefined => {
    if (chain.startsWith(HEX_CHAIN_ID_PREFIX)) {
        const chainId = HEX_CHAIN_ID_PATTERN.test(chain) ? Number(chain) : undefined;

        return chainId !== undefined && Number.isSafeInteger(chainId)
            ? getNetworkByEvmChainId(chainId)
            : undefined;
    }

    const entry = Object.entries(BLOCKAID_EVM_CHAIN_BY_CHAIN_ID).find(
        ([, blockaidChain]) => blockaidChain === chain,
    );

    return entry ? getNetworkByEvmChainId(Number(entry[0])) : undefined;
};
