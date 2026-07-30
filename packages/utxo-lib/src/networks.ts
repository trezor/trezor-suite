// upstream: https://github.com/bitcoinjs/bitcoinjs-lib/blob/master/ts_src/networks.ts
// fork: https://github.com/trezor/trezor-utxo-lib/blob/trezor/src/networks.js
// differences:
// - more specific networks (zcash/komodo)
// - network type validation function.

import { Type, UInt16, UInt32, UInt8, checkType } from './types/validation';

export interface Bip32 {
    public: number;
    private: number;
}

export interface Network {
    messagePrefix: string;
    bech32: string;
    bip32: Bip32;
    pubKeyHash: number;
    scriptHash: number;
    wif: number;
    forkId?: number;
}

export const bitcoin: Network = {
    messagePrefix: '\x18Bitcoin Signed Message:\n',
    bech32: 'bc',
    bip32: {
        public: 0x0488b21e,
        private: 0x0488ade4,
    },
    pubKeyHash: 0x00,
    scriptHash: 0x05,
    wif: 0x80,
};

export const regtest: Network = {
    messagePrefix: '\x18Bitcoin Signed Message:\n',
    bech32: 'bcrt',
    bip32: {
        public: 0x043587cf,
        private: 0x04358394,
    },
    pubKeyHash: 0x6f,
    scriptHash: 0xc4,
    wif: 0xef,
};

export const testnet: Network = {
    messagePrefix: '\x18Bitcoin Signed Message:\n',
    bech32: 'tb',
    bip32: {
        public: 0x043587cf,
        private: 0x04358394,
    },
    pubKeyHash: 0x6f,
    scriptHash: 0xc4,
    wif: 0xef,
};

export const bitcoincash: Network = {
    messagePrefix: '\x18Bitcoin Signed Message:\n',
    bech32: '',
    bip32: {
        public: 0x0488b21e,
        private: 0x0488ade4,
    },
    pubKeyHash: 0x00,
    scriptHash: 0x05,
    wif: 0x80,
    forkId: 0x00,
};

export const bitcoincashTest: Network = {
    messagePrefix: '\x18Bitcoin Signed Message:\n',
    bech32: '',
    bip32: {
        public: 0x043587cf,
        private: 0x04358394,
    },
    pubKeyHash: 0x6f,
    scriptHash: 0xc4,
    wif: 0xef,
    forkId: 0x00,
};

export const bitcoingold: Network = {
    messagePrefix: '\x18Bitcoin Gold Signed Message:\n',
    bech32: 'btg',
    bip32: {
        public: 0x0488b21e,
        private: 0x0488ade4,
    },
    pubKeyHash: 0x26,
    scriptHash: 0x17,
    wif: 0x80,
    forkId: 0x4f /* 79 */,
};

export const litecoin: Network = {
    messagePrefix: '\x19Litecoin Signed Message:\n',
    bech32: 'ltc',
    bip32: {
        public: 0x019da462,
        private: 0x019d9cfe,
    },
    pubKeyHash: 0x30,
    scriptHash: 0x32,
    wif: 0xb0,
};

export const litecoinTest: Network = {
    messagePrefix: '\x19Litecoin Signed Message:\n',
    bech32: 'tltc',
    bip32: {
        public: 0x043587cf,
        private: 0x04358394,
    },
    pubKeyHash: 0x6f,
    scriptHash: 0x3a,
    wif: 0xb0,
};

export const zcash: Network = {
    messagePrefix: '\x18ZCash Signed Message:\n',
    bech32: '',
    bip32: {
        public: 0x0488b21e,
        private: 0x0488ade4,
    },
    pubKeyHash: 0x1cb8,
    scriptHash: 0x1cbd,
    wif: 0x80,
};

export const zcashTest: Network = {
    messagePrefix: '\x18ZCash Signed Message:\n',
    bech32: '',
    bip32: {
        public: 0x043587cf,
        private: 0x04358394,
    },
    pubKeyHash: 0x1d25,
    scriptHash: 0x1cba,
    wif: 0xef,
};

export const komodo: Network = {
    messagePrefix: '\x18Komodo Signed Message:\n',
    bech32: '',
    bip32: {
        public: 0x0488b21e,
        private: 0x0488ade4,
    },
    pubKeyHash: 0x3c,
    scriptHash: 0x55,
    wif: 0xbc,
};

export const doge: Network = {
    messagePrefix: '\x19Dogecoin Signed Message:\n',
    bech32: '',
    bip32: {
        public: 0x02facafd,
        private: 0x02fac398,
    },
    pubKeyHash: 0x1e,
    scriptHash: 0x16,
    wif: 0x9e,
};

const NETWORK_TYPES = {
    bitcoinCash: [bitcoincash, bitcoincashTest],
    zcash: [zcash, zcashTest, komodo],
    litecoin: [litecoin, litecoinTest],
    doge: [doge],
};

export type NetworkTypes = keyof typeof NETWORK_TYPES;

const networkSchema = Type.Object(
    {
        bip32: Type.Object(
            {
                public: UInt32,
                private: UInt32,
            },
            { additionalProperties: true },
        ),
        pubKeyHash: Type.Union([UInt8, UInt16]),
        scriptHash: Type.Union([UInt8, UInt16]),
    },
    { additionalProperties: true },
);

export function isNetworkType(type: NetworkTypes, network?: Network) {
    if (typeof type !== 'string' || !network || !NETWORK_TYPES[type]) return false;

    if (!checkType(networkSchema, network)) return false;

    return !!NETWORK_TYPES[type].find(
        n =>
            n.bip32.public === network.bip32.public &&
            n.bip32.private === network.bip32.private &&
            ((!n.bech32 && !network.bech32) || n.bech32 === network.bech32) &&
            ((!n.forkId && !network.forkId) || n.forkId === network.forkId) &&
            n.pubKeyHash === network.pubKeyHash &&
            n.scriptHash === network.scriptHash,
    );
}
