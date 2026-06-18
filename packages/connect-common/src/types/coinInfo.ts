import { DeviceModelInternal } from '@trezor/device-utils';
import type { Static } from '@trezor/schema-utils';
import { Type } from '@trezor/schema-utils';

import { FeeLevel } from './fees';

// TODO: refactor in utxo-lib
// import { Network } from '@trezor/utxo-lib';
export type Bip32 = Static<typeof Bip32>;
export const Bip32 = Type.Object({
    public: Type.Number(),
    private: Type.Number(),
});

export type Network = Static<typeof Network>;
export const Network = Type.Object({
    messagePrefix: Type.String(),
    bech32: Type.String(),
    bip32: Bip32,
    pubKeyHash: Type.Number(),
    scriptHash: Type.Number(),
    wif: Type.Number(),
    forkId: Type.Optional(Type.Number()),
});

export type CoinObj = Static<typeof CoinObj>;
export const CoinObj = Type.Object({
    coin: Type.String(),
    identity: Type.Optional(Type.String()),
});

export type CoinSupport = Static<typeof CoinSupport>;
export const CoinSupport = Type.Record(
    Type.KeyOfEnum(DeviceModelInternal),
    Type.Union([Type.String(), Type.Literal(false)]),
);

export type BlockchainLink = Static<typeof BlockchainLink>;
export const BlockchainLink = Type.Object({
    type: Type.String(),
    url: Type.Array(Type.String()),
});

type Common = Static<typeof Common>;
const Common = Type.Object({
    label: Type.String(),
    name: Type.String(),
    shortcut: Type.String(),
    slip44: Type.Number(),
    support: CoinSupport,
    decimals: Type.Number(),
    blockchainLink: Type.Optional(BlockchainLink),
    blockTime: Type.Number(),
    minFee: Type.Number(),
    maxFee: Type.Number(),
    minPriorityFee: Type.Number(),
    defaultFees: Type.Array(FeeLevel),
});

export type BitcoinNetworkInfo = Static<typeof BitcoinNetworkInfo>;
export const BitcoinNetworkInfo = Type.Intersect([
    Common,
    Type.Object({
        type: Type.Literal('bitcoin'),
        cashAddrPrefix: Type.Optional(Type.String()),
        curveName: Type.String(),
        dustLimit: Type.Number(),
        forceBip143: Type.Boolean(),
        hashGenesisBlock: Type.String(),
        maxAddressLength: Type.Number(),
        maxFeeSatoshiKb: Type.Number(),
        minAddressLength: Type.Number(),
        minFeeSatoshiKb: Type.Number(),
        segwit: Type.Boolean(),
        xPubMagic: Type.Number(),
        xPubMagicSegwitNative: Type.Optional(Type.Number()),
        xPubMagicSegwit: Type.Optional(Type.Number()),
        taproot: Type.Optional(Type.Boolean()),
        network: Network,
        isBitcoin: Type.Boolean(), // = only the Bitcoin, it's testnet and regtest (no BCH and other Bitcoin forks...),
    }),
]);

export type EthereumNetworkInfo = Static<typeof EthereumNetworkInfo>;
export const EthereumNetworkInfo = Type.Intersect([
    Common,
    Type.Object({
        type: Type.Literal('ethereum'),
        chainId: Type.Number(),
        network: Type.Optional(Type.Undefined()),
    }),
]);

export type EthereumNetworkInfoDefinitionValues = Static<
    typeof EthereumNetworkInfoDefinitionValues
>;
export const EthereumNetworkInfoDefinitionValues = Type.Omit(EthereumNetworkInfo, [
    'minFee',
    'maxFee',
    'defaultFees',
    'minPriorityFee',
    'blockTime',
]);

export type MiscNetworkInfo = Static<typeof MiscNetworkInfo>;
export const MiscNetworkInfo = Type.Intersect([
    Common,
    Type.Object({
        type: Type.Literal('misc'),
        curve: Type.String(),
        network: Type.Optional(Type.Undefined()),
    }),
]);

export type CoinInfo = Static<typeof CoinInfo>;
export const CoinInfo = Type.Union([BitcoinNetworkInfo, EthereumNetworkInfo, MiscNetworkInfo]);

// Canonical list of supported coin symbols (lowercased coinInfo `shortcut`s), grouped by
// coinInfo category. Source of truth for the `CoinSymbol` type. The runtime guard
// (`getCoinInfo`, `enabledNetworksStore`) compares case-insensitively, so values are kept
// lowercase here. A drift test in @trezor/connect pins this to the @trezor/connect-data coin
// definitions — adding or removing a coin there without updating this list fails that test.
export const coinSymbols = [
    // UTXO coins, handled by the bitcoin methods (getAddress, getPublicKey, signTransaction, ...)
    'btc',
    'regtest',
    'test',
    'bch',
    'tbch',
    'btg',
    'tbtg',
    'dash',
    'tdash',
    'dcr',
    'tdcr',
    'dgb',
    'doge',
    'elements',
    'ftc',
    'firo',
    'tfiro',
    'fjc',
    'grs',
    'tgrs',
    'kmd',
    'ltc',
    'tltc',
    'mona',
    'nmc',
    'qtum',
    'tqtum',
    'rvn',
    'trvn',
    'sys',
    'xvg',
    'vtc',
    'zec',
    'taz',
    // EVM coins
    'eth',
    'op',
    'avax',
    'bsc',
    'etc',
    'pol',
    'base',
    'thod',
    'arb',
    'tsep',
    // misc coins (cardano, solana, ripple, stellar, tron, monero, tezos, ...)
    'ada',
    'bnb',
    'dsol',
    'maid',
    'nostr',
    'omni',
    'sol',
    'tada',
    'txrp',
    'usdt',
    'xlm',
    'trx',
    'ttrx',
    'txlm',
    'xmr',
    'xrp',
    'xtz',
] as const;

// A supported coin symbol, e.g. `'btc'` / `'ada'`. See `coinSymbols`.
export type CoinSymbol = (typeof coinSymbols)[number];

const coinSymbolSet: ReadonlySet<string> = new Set(coinSymbols);

// Runtime validation for `CoinSymbol`, derived from the same `coinSymbols` source as the type.
// Strict on the canonical lowercase form; callers accepting mixed case should lowercase first
// (the coin guard in @trezor/connect compares case-insensitively).
export const isCoinSymbol = (value: string): value is CoinSymbol => coinSymbolSet.has(value);
