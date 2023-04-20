import type { Network } from '@trezor/utxo-lib';

export type { Network } from '@trezor/utxo-lib';

export interface CoinSupport {
    connect: boolean;
    trezor1: string;
    trezor2: string;
}

export interface BlockchainLink {
    type: string;
    url: string[];
}

export type BitcoinDefaultFeesKeys = 'High' | 'Normal' | 'Economy' | 'Low';
export type BitcoinDefaultFees = { [key in BitcoinDefaultFeesKeys]: number };

interface Common {
    label: string; // Human readable format, label != name
    name: string; // Trezor readable format
    shortcut: string;
    slip44: number;
    support: CoinSupport;
    decimals: number;
    blockchainLink?: BlockchainLink;
    blocktime: number;
    minFee: number;
    maxFee: number;
}

export interface BitcoinNetworkInfo extends Common {
    type: 'bitcoin';
    cashAddrPrefix?: string;
    curveName: string;
    dustLimit: number;
    forceBip143: boolean;
    hashGenesisBlock: string;
    maxAddressLength: number;
    maxFeeSatoshiKb: number;
    minAddressLength: number;
    minFeeSatoshiKb: number;
    defaultFees: BitcoinDefaultFees;
    segwit: boolean;

    xPubMagic: number;
    xPubMagicSegwitNative?: number;
    xPubMagicSegwit?: number;
    taproot?: boolean;

    // custom
    network: Network;
    isBitcoin: boolean;
    // used in backend
    blocks?: number;
}

export interface EthereumNetworkInfo extends Common {
    type: 'ethereum';
    chainId: number;
    defaultFees: Array<{
        label: 'high' | 'normal' | 'low';
        feePerUnit: string;
        feeLimit: string;
    }>;
    network: typeof undefined;
}

export interface MiscNetworkInfo extends Common {
    type: 'misc' | 'nem';
    curve: string;
    defaultFees: BitcoinDefaultFees;
    network: typeof undefined; // compatibility
}

export type CoinInfo = BitcoinNetworkInfo | EthereumNetworkInfo | MiscNetworkInfo;
