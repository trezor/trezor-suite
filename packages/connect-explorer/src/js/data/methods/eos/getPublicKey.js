/* @flow */


const name = 'eosGetPublicKey';
const docs = 'methods/eosGetPublicKey.md';
const batch = [
    {
        name: 'path',
        label: 'Bip44 path',
        type: 'input',
        value: `m/44'/194'/0'/0/0`,
    },
    {
        name: 'showOnTrezor',
        label: 'Show on Trezor',
        type: 'checkbox',
        defaultValue: true,
        value: true,
    },
];

export default [
    {
        url: '/method/eosGetPublicKey',
        name,
        docs,
        submitButton: 'Get public key',

        fields: batch,
    },

    {
        url: '/method/eosGetPublicKey-multiple',
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
                items: [
                    batch,
                    batch,
                ]
            },
        ],
    },
];