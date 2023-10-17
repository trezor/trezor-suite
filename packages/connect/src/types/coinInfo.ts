import { FeeLevel } from './fees';

export interface CoinSupport {
    connect: boolean;
    T1B1: string;
    T2T1: string;
    T2B1: string;
}

// copy-paste from '@trezor/utxo-lib' module
export interface Network {
    messagePrefix: string;
    bech32: string;
    bip32: {
        public: number;
        private: number;
    };
    pubKeyHash: number;
    scriptHash: number;
    wif: number;
    forkId?: number;
}

export interface BlockchainLink {
    type: string;
    url: string[];
}

interface Common {
    label: string; // Human readable format, label != name
    name: string; // Trezor readable format
    shortcut: string;
    slip44: number;
    support: CoinSupport;
    decimals: number;
    blockchainLink?: BlockchainLink;
    blockTime: number;
    minFee: number;
    maxFee: number;
    defaultFees: FeeLevel[];
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
    segwit: boolean;

    xPubMagic: number;
    xPubMagicSegwitNative?: number;
    xPubMagicSegwit?: number;
    taproot?: boolean;

    // custom
    network: Network;
    isBitcoin: boolean;
}

export interface EthereumNetworkInfo extends Common {
    type: 'ethereum';
    chainId: number;
    network?: typeof undefined;
}

export interface MiscNetworkInfo extends Common {
    type: 'misc' | 'nem';
    curve: string;
    network?: typeof undefined; // compatibility
}

export type CoinInfo = BitcoinNetworkInfo | EthereumNetworkInfo | MiscNetworkInfo;
