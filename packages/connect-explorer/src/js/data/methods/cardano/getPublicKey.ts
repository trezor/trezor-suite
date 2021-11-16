// todo: import from trezor-connect
enum CardanoDerivationType {
    LEDGER = 0,
    ICARUS = 1,
    ICARUS_TREZOR = 2,
}

const name = 'cardanoGetPublicKey';
const docs = 'methods/cardanoGetPublicKey.md';
const batch = [
    {
        name: 'path',
        label: 'Bip44 path',
        type: 'input',
        value: `m/44'/1815'/0'`,
    },
    {
        name: 'showOnTrezor',
        label: 'Show on Trezor',
        type: 'checkbox',
        defaultValue: true,
        value: true,
    },
    {
        name: 'derivation_type',
        label: 'Derivation type',
        type: 'number',
        value: CardanoDerivationType.ICARUS_TREZOR,
    },
];

export default [
    {
        url: '/method/cardanoGetPublicKey',
        name,
        docs,
        submitButton: 'Get public key',

        fields: batch,
    },

    {
        url: '/method/cardanoGetPublicKey-multiple',
        name,
        docs,
        submitButton: 'Get multiple public keys',

        fields: [
            {
                name: 'bundle',
                type: 'array',
                batch: [
                    {
                        type: '',
                        fields: batch,
                    },
                ],
                items: [batch, batch],
            },
        ],
    },
];
