// upstream: https://github.com/bitcoinjs/bitcoinjs-lib/blob/master/ts_src/networks.ts
// fork: https://github.com/trezor/trezor-utxo-lib/blob/trezor/src/networks.js
// differences:
// - more specific networks (zcash/komodo, dash, peercoin, decred)
// - network type validation function.

import * as typeforce from 'typeforce';

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
    consensusBranchId?: { [version: number]: number };
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

export const dash: Network = {
    messagePrefix: '\x19DarkCoin Signed Message:\n',
    bech32: '',
    bip32: {
        public: 0x02fe52cc,
        private: 0x2fe52f8,
    },
    pubKeyHash: 0x4c, // https://dash-docs.github.io/en/developer-reference#opcodes
    scriptHash: 0x10,
    wif: 0xcc,
};

export const dashTest: Network = {
    messagePrefix: '\x19DarkCoin Signed Message:\n',
    bech32: '',
    bip32: {
        public: 0x043587cf,
        private: 0x04358394,
    },
    pubKeyHash: 0x8c, // https://dash-docs.github.io/en/developer-reference#opcodes
    scriptHash: 0x13,
    wif: 0xef, // https://github.com/dashpay/godashutil/blob/master/wif.go#L72
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
    // This parameter was introduced in version 3 to allow soft forks, for version 1 and 2 transactions we add a
    // dummy value.
    consensusBranchId: {
        1: 0x00,
        2: 0x00,
        3: 0x5ba81b19,
        4: 0xf5b9230b,
    },
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
    consensusBranchId: {
        1: 0x00,
        2: 0x00,
        3: 0x5ba81b19,
        4: 0xf5b9230b,
    },
};

export const peercoin: Network = {
    messagePrefix: '\x18Peercoin Signed Message:\n',
    bech32: 'pc',
    bip32: {
        public: 0x488b21e,
        private: 0x0488ade4,
    },
    pubKeyHash: 0x37,
    scriptHash: 0x75,
    wif: 0,
};

export const peercoinTest: Network = {
    messagePrefix: '\x18Peercoin Signed Message:\n',
    bech32: 'tpc',
    bip32: {
        public: 0x43587cf,
        private: 0x04358394,
    },
    pubKeyHash: 0x6f,
    scriptHash: 0xc4,
    wif: 0,
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
    // This parameter was introduced in version 3 to allow soft forks, for version 1 and 2 transactions we add a
    // dummy value.
    consensusBranchId: {
        1: 0x00,
        2: 0x00,
        3: 0x5ba81b19,
        4: 0x76b809bb,
    },
};

export const decred: Network = {
    messagePrefix: '\x17Decred Signed Message:\n',
    bech32: '',
    bip32: {
        public: 0x02fda926,
        private: 0x02fda4e8,
    },
    pubKeyHash: 0x073f,
    scriptHash: 0x071a,
    wif: 0x22de,
};

export const decredTest: Network = {
    messagePrefix: '\x17Decred Signed Message:\n',
    bech32: '',
    bip32: {
        public: 0x043587d1,
        private: 0x04358397,
    },
    pubKeyHash: 0x0f21,
    scriptHash: 0x0efc,
    wif: 0x230e,
};

export const decredSim: Network = {
    messagePrefix: '\x17Decred Signed Message:\n',
    bech32: '',
    bip32: {
        public: 0x0420bd3d,
        private: 0x0420b903,
    },
    pubKeyHash: 0x0e91,
    scriptHash: 0x0e6c,
    wif: 0x2307,
};

const NETWORK_TYPES = {
    bitcoinCash: [bitcoincash, bitcoincashTest],
    dash: [dash, dashTest],
    decred: [decred, decredTest, decredSim],
    peercoin: [peercoin, peercoinTest],
    zcash: [zcash, zcashTest, komodo],
};

export type NetworkTypes = keyof typeof NETWORK_TYPES;

export function isNetworkType(type: NetworkTypes, network?: Network) {
    if (typeof type !== 'string' || !network || !NETWORK_TYPES[type]) return false;
    try {
        typeforce(
            {
                bip32: {
                    public: typeforce.UInt32,
                    private: typeforce.UInt32,
                },
                pubKeyHash: typeforce.anyOf(typeforce.UInt8, typeforce.UInt16),
                scriptHash: typeforce.anyOf(typeforce.UInt8, typeforce.UInt16),
            },
            network,
        );
    } catch (e) {
        return false;
    }
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
