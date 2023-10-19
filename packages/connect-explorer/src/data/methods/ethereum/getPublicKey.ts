const name = 'ethereumGetPublicKey';
const docs = 'methods/ethereumGetPublicKey.md';
const batch = [
    {
        name: 'path',
        label: 'Bip44 path',
        type: 'input',
        value: `m/44'/60'/0'/0`,
    },
    {
        name: 'showOnTrezor',
        label: 'Show on Trezor',
        type: 'checkbox',
        value: true,
    },
];

export default [
    {
        url: '/method/ethereumGetPublicKey',
        name,
        docs,
        submitButton: 'Get public key',

        fields: batch,
    },

    {
        url: '/method/ethereumGetPublicKey-multiple',
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
