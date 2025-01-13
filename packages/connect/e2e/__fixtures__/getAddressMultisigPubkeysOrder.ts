import { MultisigPubkeysOrder } from '@trezor/protobuf/src/messages';

// https://github.com/trezor/trezor-firmware/blob/main/tests/device_tests/bitcoin/test_getaddress.py

const nodeInternal = {
    // trezorctl btc get-public-node -n m/45h/0
    node: 'xpub69numS2foCPDWvbnTE95o7m92kWr1CFoSA91EHAADBDHcaQw6VwrDFbg5KUGGnyLdKjJ3ohRG4BHQNzpM1kBbVPKkBQB5j221NcvByaWDz2',
    address_n: [0, 0],
};

const nodeExternal = {
    // trezorctl btc get-public-node -n m/45h/1
    node: 'xpub69numS2foCPDZmjusERkaVyVhRAQXzCjpYExzFSEHCV8615UzJDnCeHDU8av9eXoaWR5CESEymVz1KBhpgFCpLg22jA6msZ4VGWaUXcSSDy',
    address_n: [0, 0],
};
const pubkeysOrder1 = [nodeInternal, nodeExternal];

const pubkeysOrder2 = [nodeExternal, nodeInternal];

const multisigUnsorted1 = {
    pubkeys: pubkeysOrder1,
    signatures: ['', ''],
    m: 2,
    pubkeys_order: MultisigPubkeysOrder.PRESERVED,
};

const multisigUnsorted2 = {
    pubkeys: pubkeysOrder2,
    signatures: ['', ''],
    m: 2,
    pubkeys_order: MultisigPubkeysOrder.PRESERVED,
};

const multisigSorted1 = {
    pubkeys: pubkeysOrder1,
    signatures: ['', ''],
    m: 2,
    pubkeys_order: MultisigPubkeysOrder.LEXICOGRAPHIC,
};

const multisigSorted2 = {
    pubkeys: pubkeysOrder2,
    signatures: ['', ''],
    m: 2,
    pubkeys_order: MultisigPubkeysOrder.LEXICOGRAPHIC,
};

const addressUnsorted1 = '3DKeup4KhFpvJPpqnPRdZMte73YZC3v8dS';
const addressUnsorted2 = '3DpiomhFpTzGJZNksqn67pW5AUV1xHBMG1';

// trezorctl btc get-address -n m/45h/0/0/0 -m 2 -x xpub1 -x xpub2 --multisig-sort-pubkeys
export default {
    method: 'getAddress',
    setup: {
        mnemonic: 'mnemonic_all',
        settings: {
            safety_checks: 2,
        },
    },
    tests: [
        {
            description: 'show multisig address unsorted (1)',
            params: {
                path: "m/45'/0/0/0",
                multisig: multisigUnsorted1,
                scriptType: 'SPENDMULTISIG',
                showOnTrezor: true,
            },
            result: {
                address: addressUnsorted1,
            },
        },
        {
            description: 'show multisig address unsorted (1)',
            params: {
                path: "m/45'/0/0/0",
                multisig: multisigUnsorted2,
                scriptType: 'SPENDMULTISIG',
                showOnTrezor: true,
            },
            result: {
                address: addressUnsorted2,
            },
        },
        {
            description: 'show multisig address sorted (1)',
            params: {
                path: "m/45'/0/0/0",
                multisig: multisigSorted1,
                scriptType: 'SPENDMULTISIG',
                showOnTrezor: true,
            },
            result: {
                address: addressUnsorted1,
            },
        },
        {
            description: 'show multisig address sorted (1)',
            params: {
                path: "m/45'/0/0/0",
                multisig: multisigSorted2,
                scriptType: 'SPENDMULTISIG',
                showOnTrezor: true,
            },
            result: {
                address: addressUnsorted1,
            },
            legacyResults: [
                // https://github.com/trezor/trezor-firmware/pull/4351
                {
                    rules: ['<2.8.7'],
                    payload: {
                        address: addressUnsorted2,
                    },
                },
            ],
        },
    ],
};
