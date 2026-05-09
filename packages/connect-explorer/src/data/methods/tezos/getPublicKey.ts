const name = 'tezosGetPublicKey';
const batch = [
    {
        name: 'path',
        type: 'input',
        value: `m/44'/1729'/0'`,
    },
    {
        name: 'showOnTrezor',
        type: 'checkbox',
        value: true,
    },
    {
        name: 'chunkify',
        type: 'checkbox',
        value: false,
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
