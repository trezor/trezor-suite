const name = 'ethereumGetPublicKey';
const batch = [
    {
        name: 'path',
        type: 'input',
        value: `m/44'/60'/0'/0`,
    },
    {
        name: 'showOnTrezor',
        type: 'checkbox',
        value: true,
    },
];

export default [
    {
        name,
        submitButton: 'Get public key',

        fields: batch,
    },

    {
        name,
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
