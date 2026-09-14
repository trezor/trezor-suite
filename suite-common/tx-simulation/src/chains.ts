import { type TransactionScanSupportedChain } from '@blockaid/client/resources/evm';
import { type MessageScanParams } from '@blockaid/client/resources/solana/message';
import { type TransactionScanParams as StellarScanParams } from '@blockaid/client/resources/stellar/transaction';
import { type NetworkConfigDeps } from '@suite-common/networks';

import {
    type Network,
    type NetworkConfig,
    getNetwork,
    getNetworkByEvmChainId,
} from '@suite-common/wallet-config';
import { type SolanaNetworkSymbol } from '@trezor/network-solana/constants';
import { type StellarNetworkSymbol } from '@trezor/network-stellar/constants';

type EvmChainId = Extract<NetworkConfig, { networkType: 'ethereum' }>['chainId'];
type BlockaidSolanaChain = NonNullable<MessageScanParams['chain']>;
type BlockaidStellarChain = StellarScanParams['chain'];

const BLOCKAID_EVM_CHAIN_BY_CHAIN_ID = (networkConfigDeps: NetworkConfigDeps) =>
    ({
        [getNetwork(networkConfigDeps, 'eth').chainId]: 'ethereum',
        [getNetwork(networkConfigDeps, 'op').chainId]: 'optimism',
        [getNetwork(networkConfigDeps, 'bsc').chainId]: 'bsc',
        [getNetwork(networkConfigDeps, 'pol').chainId]: 'polygon',
        [getNetwork(networkConfigDeps, 'base').chainId]: 'base',
        [getNetwork(networkConfigDeps, 'arb').chainId]: 'arbitrum',
        [getNetwork(networkConfigDeps, 'rhc').chainId]: 'robinhood',
        [getNetwork(networkConfigDeps, 'hype').chainId]: 'hyperevm',
        [getNetwork(networkConfigDeps, 'avax').chainId]: 'avalanche',
        [getNetwork(networkConfigDeps, 'tsep').chainId]: 'ethereum-sepolia',
        // Blockaid has no Ethereum Classic chain; the old 'ethereumClassic' value is rejected.
        [getNetwork(networkConfigDeps, 'etc').chainId]: null,
        [getNetwork(networkConfigDeps, 'thod').chainId]: null, // Hoodi is not a supported testnet
    }) as const satisfies Readonly<Record<EvmChainId, TransactionScanSupportedChain | null>>;

const BLOCKAID_SOLANA_CHAIN_BY_SYMBOL = {
    sol: 'mainnet',
    dsol: 'devnet',
} as const satisfies Readonly<Record<SolanaNetworkSymbol, BlockaidSolanaChain>>;

const BLOCKAID_STELLAR_CHAIN_BY_SYMBOL = {
    xlm: 'pubnet',
    txlm: 'testnet',
} as const satisfies Readonly<Record<StellarNetworkSymbol, BlockaidStellarChain>>;

export const resolveBlockaidEvmChain = (
    networkConfigDeps: NetworkConfigDeps,
    chainId: number | undefined = getNetwork(networkConfigDeps, 'eth').chainId,
) => BLOCKAID_EVM_CHAIN_BY_CHAIN_ID(networkConfigDeps)[chainId] ?? null;

export const resolveBlockaidSolanaChain = (symbol: SolanaNetworkSymbol) =>
    BLOCKAID_SOLANA_CHAIN_BY_SYMBOL[symbol];

export const resolveBlockaidStellarChain = (symbol: StellarNetworkSymbol) =>
    BLOCKAID_STELLAR_CHAIN_BY_SYMBOL[symbol];

export const getNetworkByBlockaidChain = (
    networkConfigDeps: NetworkConfigDeps,
    chain: string,
): Network | undefined => {
    const entry = Object.entries(BLOCKAID_EVM_CHAIN_BY_CHAIN_ID(networkConfigDeps)).find(
        ([, blockaidChain]) => blockaidChain === chain,
    );

    return entry ? getNetworkByEvmChainId(networkConfigDeps, Number(entry[0])) : undefined;
};
