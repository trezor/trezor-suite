import { networks } from '@trezor/utxo-lib';

const NETWORK_P2SH = {
    ...networks.bitcoin,
    bip32: {
        ...networks.bitcoin.bip32,
        public: 77429938, // coins.json Bitcoin/xpub_magic_segwit_p2sh
    },
};

const NETWORK_P2WPKH = {
    ...networks.bitcoin,
    bip32: {
        ...networks.bitcoin.bip32,
        public: 78792518, // coins.json Bitcoin/xpub_magic_segwit_native
    },
};

export const convertXpub = [
    {
        description: 'No requested network == no change',
        network: networks.bitcoin,
        xpub: 'xpub6CVKsQYXc9awxgV1tWbG4foDvdcnieK2JkbpPEBKB5WwAPKBZ1mstLbKVB4ov7QzxzjaxNK6EfmNY5Jsk2cG26EVcEkycGW4tchT2dyUhrx',
        result: 'xpub6CVKsQYXc9awxgV1tWbG4foDvdcnieK2JkbpPEBKB5WwAPKBZ1mstLbKVB4ov7QzxzjaxNK6EfmNY5Jsk2cG26EVcEkycGW4tchT2dyUhrx',
    },
    {
        description: 'P2PKH > P2SH',
        network: networks.bitcoin,
        requestedNetwork: NETWORK_P2SH,
        xpub: 'xpub6CVKsQYXc9awxgV1tWbG4foDvdcnieK2JkbpPEBKB5WwAPKBZ1mstLbKVB4ov7QzxzjaxNK6EfmNY5Jsk2cG26EVcEkycGW4tchT2dyUhrx',
        result: 'ypub6XKbB5DSkq8Royg8isNtGktj6bmEfGJXDs83Ad5CZ5tpDV8QofwSWQFTWP2Pv24vNdrPhquehL7vRMvSTj2GpKv6UaTQCBKZALm6RJAmxG6',
    },
    {
        description: 'P2SH > P2PKH',
        network: NETWORK_P2SH,
        requestedNetwork: networks.bitcoin,
        xpub: 'ypub6XKbB5DSkq8Royg8isNtGktj6bmEfGJXDs83Ad5CZ5tpDV8QofwSWQFTWP2Pv24vNdrPhquehL7vRMvSTj2GpKv6UaTQCBKZALm6RJAmxG6',
        result: 'xpub6CVKsQYXc9awxgV1tWbG4foDvdcnieK2JkbpPEBKB5WwAPKBZ1mstLbKVB4ov7QzxzjaxNK6EfmNY5Jsk2cG26EVcEkycGW4tchT2dyUhrx',
    },
    {
        description: 'P2PKH > Bech32/P2WPKH',
        network: networks.bitcoin,
        requestedNetwork: NETWORK_P2WPKH,
        xpub: 'xpub6DDUPHpUo4pcy43iJeZjbSVWGav1SMMmuWdMHiGtkK8rhKmfbomtkwW6GKs1GGAKehT6QRocrmda3WWxXawpjmwaUHfFRXuKrXSapdckEYF',
        result: 'zpub6rszzdAK6RuafeRwyN8z1cgWcXCuKbLmjjfnrW4fWKtcoXQ8787214pNJjnBG5UATyghuNzjn6Lfp5k5xymrLFJnCy46bMYJPyZsbpFGagT',
    },
    {
        description: 'Bech32/P2WPKH > P2PKH',
        network: NETWORK_P2WPKH,
        requestedNetwork: networks.bitcoin,
        xpub: 'zpub6rszzdAK6RuafeRwyN8z1cgWcXCuKbLmjjfnrW4fWKtcoXQ8787214pNJjnBG5UATyghuNzjn6Lfp5k5xymrLFJnCy46bMYJPyZsbpFGagT',
        result: 'xpub6DDUPHpUo4pcy43iJeZjbSVWGav1SMMmuWdMHiGtkK8rhKmfbomtkwW6GKs1GGAKehT6QRocrmda3WWxXawpjmwaUHfFRXuKrXSapdckEYF',
    },
];

export const convertBitcoinXpub = [
    {
        description: 'No requested network == no change',
        network: networks.bitcoin,
        xpub: 'xpub6CVKsQYXc9awxgV1tWbG4foDvdcnieK2JkbpPEBKB5WwAPKBZ1mstLbKVB4ov7QzxzjaxNK6EfmNY5Jsk2cG26EVcEkycGW4tchT2dyUhrx',
        result: 'xpub6CVKsQYXc9awxgV1tWbG4foDvdcnieK2JkbpPEBKB5WwAPKBZ1mstLbKVB4ov7QzxzjaxNK6EfmNY5Jsk2cG26EVcEkycGW4tchT2dyUhrx',
    },
    {
        description: 'Requested network P2SH',
        network: NETWORK_P2SH,
        xpub: 'xpub6CVKsQYXc9awxgV1tWbG4foDvdcnieK2JkbpPEBKB5WwAPKBZ1mstLbKVB4ov7QzxzjaxNK6EfmNY5Jsk2cG26EVcEkycGW4tchT2dyUhrx',
        result: 'ypub6XKbB5DSkq8Royg8isNtGktj6bmEfGJXDs83Ad5CZ5tpDV8QofwSWQFTWP2Pv24vNdrPhquehL7vRMvSTj2GpKv6UaTQCBKZALm6RJAmxG6',
    },
    {
        description: 'Requested network Bech32/P2WPKH',
        network: NETWORK_P2WPKH,
        xpub: 'xpub6DDUPHpUo4pcy43iJeZjbSVWGav1SMMmuWdMHiGtkK8rhKmfbomtkwW6GKs1GGAKehT6QRocrmda3WWxXawpjmwaUHfFRXuKrXSapdckEYF',
        result: 'zpub6rszzdAK6RuafeRwyN8z1cgWcXCuKbLmjjfnrW4fWKtcoXQ8787214pNJjnBG5UATyghuNzjn6Lfp5k5xymrLFJnCy46bMYJPyZsbpFGagT',
    },
];

export const convertMultisigPubKey = [
    {
        description: 'no multisig = no conversion',
        utxo: {},
        result: {},
    },
    {
        description: 'no pubkeys = no conversion',
        utxo: {
            multisig: {},
        },
        result: {
            multisig: {},
        },
    },
    {
        description: 'node is not a string = no conversion',
        utxo: {
            multisig: {
                pubkeys: [{ node: { depth: 4 } }],
            },
        },
        result: {
            multisig: {
                pubkeys: [{ node: { depth: 4 } }],
            },
        },
    },
    {
        description: 'convert multisig input',
        network: networks.bitcoin,
        utxo: {
            multisig: {
                pubkeys: [
                    {
                        node: 'xpub6EexEtC6c2rN5QCpzrL2nUNGDfxizCi3kM1C2Mk5a6PfQs4H3F72C642M3XbnzycvvtD4U6vzn1nYPpH8VUmiREc2YuXP3EFgN1uLTrVEj4',
                    },
                ],
            },
        },
        result: {
            multisig: {
                pubkeys: [
                    {
                        node: {
                            chain_code:
                                'fd5fd24c06088bce57f3d817df206d0891adf5a77f5391bdc12793ef1917460e',
                            child_num: 2147483648,
                            depth: 4,
                            fingerprint: 2559962404,
                            public_key:
                                '02d598ec0f8f418c80859b690e8ee731e2bf7c8e2233d7fa722249bc3f27a65151',
                        },
                    },
                ],
            },
        },
    },
];

// m/49'/0'/0'
const DEFAULT_NODE = {
    xpub: 'xpub6CVKsQYXc9awxgV1tWbG4foDvdcnieK2JkbpPEBKB5WwAPKBZ1mstLbKVB4ov7QzxzjaxNK6EfmNY5Jsk2cG26EVcEkycGW4tchT2dyUhrx',
    node: {
        child_num: 2147483648,
        chain_code: '072d8252ea73b130c7f6139daf220842bf0d42ffe43fd274c9c158504f4c50bf',
        public_key: '0215a09870bbb713f1ba94d364e1e5bfcf9cdb5178d22efbca6ec17dc2c4f706cd',
        fingerprint: 1910945124,
        depth: 3,
    },
};

// m/49'/0'/0'/0
const DEFAULT_NODE_CHILD = {
    xpub: 'xpub6EnV9K1LzPtRDXqqcDkBk99uCFneHiHR3DBQxXcbuWzQoUGLfJiHeF3uDW1JZH3ZG7mr4TuNtPbgLYwEibEkcDcnQkQksZi7jm3eY8PqKFv',
    node: {
        child_num: 0,
        chain_code: '2589d77d82c575ed697ef8122f8c44c235377d2969c7a674fe73a7347066c4b6',
        public_key: '020ddd7e4206daf889a2c11920fcccbb60df383d4c5fcd982cd5c7d400fdd46c8e',
        fingerprint: 2856412653,
        depth: 4,
    },
};

export const xpubDerive = [
    {
        description: 'success P2PKH format',
        suffix: 0,
        xpub: DEFAULT_NODE,
        childXPub: DEFAULT_NODE_CHILD,
    },
    {
        description: 'success P2SH format',
        suffix: 0,
        xpub: {
            ...DEFAULT_NODE,
            xpub: 'ypub6XKbB5DSkq8Royg8isNtGktj6bmEfGJXDs83Ad5CZ5tpDV8QofwSWQFTWP2Pv24vNdrPhquehL7vRMvSTj2GpKv6UaTQCBKZALm6RJAmxG6',
        },
        childXPub: {
            ...DEFAULT_NODE_CHILD,
            xpub: 'ypub6ZckSygG95Ru4q2xSaXoxEFQNDw6ELGuxKhdjvWVHXNHra5ZuxsrGJi3EhxtZBhUfkteowVwM3xEDqYoSHemQTJPH67BTUXc1V7Hvneqgzd',
        },
        network: NETWORK_P2SH,
    },
    {
        description: 'Invalid network version. (P2SH xpub is used, but network is set to P2PKH)',
        suffix: 0,
        xpub: {
            ...DEFAULT_NODE,
            xpub: 'ypub6XKbB5DSkq8Royg8isNtGktj6bmEfGJXDs83Ad5CZ5tpDV8QofwSWQFTWP2Pv24vNdrPhquehL7vRMvSTj2GpKv6UaTQCBKZALm6RJAmxG6',
        },
        childXPub: {
            ...DEFAULT_NODE_CHILD,
            xpub: 'ypub6ZckSygG95Ru4q2xSaXoxEFQNDw6ELGuxKhdjvWVHXNHra5ZuxsrGJi3EhxtZBhUfkteowVwM3xEDqYoSHemQTJPH67BTUXc1V7Hvneqgzd',
        },
        error: 'Invalid network version',
    },
    {
        description: 'Invalid public key transmission. (depths are the same)',
        suffix: 0,
        xpub: DEFAULT_NODE,
        childXPub: {
            ...DEFAULT_NODE_CHILD,
            node: {
                ...DEFAULT_NODE_CHILD.node,
                depth: 3, // same as parent
            },
        },
        error: 'Invalid public key transmission detected',
    },
    {
        description:
            'Invalid child cross-check. (suffix is set to 1 but 0 was used to derive child)',
        suffix: 1,
        xpub: DEFAULT_NODE,
        childXPub: DEFAULT_NODE_CHILD,
        error: 'Invalid child cross-check public key',
    },
];
