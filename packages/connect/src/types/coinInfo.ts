import { Type, Static } from '@trezor/schema-utils';
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
});

export type CoinSupport = Static<typeof CoinSupport>;
export const CoinSupport = Type.Object({
    connect: Type.Boolean(),
    T1B1: Type.Union([Type.String(), Type.Literal(false)]),
    T2T1: Type.Union([Type.String(), Type.Literal(false)]),
    T2B1: Type.Union([Type.String(), Type.Literal(false)]),
});

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
        isBitcoin: Type.Boolean(),
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

export type MiscNetworkInfo = Static<typeof MiscNetworkInfo>;
export const MiscNetworkInfo = Type.Intersect([
    Common,
    Type.Object({
        type: Type.Union([Type.Literal('misc'), Type.Literal('nem')]),
        curve: Type.String(),
        network: Type.Optional(Type.Undefined()),
    }),
]);

export type CoinInfo = Static<typeof CoinInfo>;
export const CoinInfo = Type.Union([BitcoinNetworkInfo, EthereumNetworkInfo, MiscNetworkInfo]);
