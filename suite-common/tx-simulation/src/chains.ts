import { type MessageScanParams } from '@blockaid/client/resources/solana/message';
import { type TransactionScanParams as StellarScanParams } from '@blockaid/client/resources/stellar/transaction';

import { type Network, getNetwork } from '@suite-common/wallet-config';
import { findEthereumNetworkSymbolByBlockaidChain } from '@trezor/network-ethereum-suite-common';
import { type SolanaNetworkSymbol } from '@trezor/network-solana/constants';
import { type StellarNetworkSymbol } from '@trezor/network-stellar/constants';

type BlockaidSolanaChain = NonNullable<MessageScanParams['chain']>;
type BlockaidStellarChain = StellarScanParams['chain'];

const BLOCKAID_SOLANA_CHAIN_BY_SYMBOL = {
    sol: 'mainnet',
    dsol: 'devnet',
} as const satisfies Readonly<Record<SolanaNetworkSymbol, BlockaidSolanaChain>>;

const BLOCKAID_STELLAR_CHAIN_BY_SYMBOL = {
    xlm: 'pubnet',
    txlm: 'testnet',
} as const satisfies Readonly<Record<StellarNetworkSymbol, BlockaidStellarChain>>;

export const resolveBlockaidSolanaChain = (symbol: SolanaNetworkSymbol) =>
    BLOCKAID_SOLANA_CHAIN_BY_SYMBOL[symbol];

export const resolveBlockaidStellarChain = (symbol: StellarNetworkSymbol) =>
    BLOCKAID_STELLAR_CHAIN_BY_SYMBOL[symbol];

export const getNetworkByBlockaidChain = (chain: string): Network | undefined => {
    const symbol = findEthereumNetworkSymbolByBlockaidChain(chain);

    return symbol ? getNetwork(symbol) : undefined;
};
