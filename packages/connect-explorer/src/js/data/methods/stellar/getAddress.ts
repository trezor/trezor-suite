const name = 'stellarGetAddress';
const docs = 'methods/stellarGetAddress.md';
const batch = [
    {
        name: 'path',
        label: 'Bip44 path',
        type: 'input',
        value: `m/44'/148'/0'`,
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
        url: '/method/stellarGetAddress',
        name,
        docs,
        submitButton: 'Get address',

        fields: batch,
    },

    {
        url: '/method/stellarGetAddress-multiple',
        name,
        docs,
        submitButton: 'Get multiple addresses',

        fields: [
            {
                name: 'bundle',
                type: 'array',
                batch: [
                    {
                        type: 'doesnt-matter',
                        fields: batch,
                    },
                ],
                items: [batch, batch],
            },
        ],
    },

    {
        url: '/method/stellarGetAddress-validation',
        name,
        docs,
        submitButton: 'Validate address',

        fields: [
            {
                name: 'path',
                label: 'Bip44 path',
                type: 'input',
                value: `m/44'/148'/0'`,
            },
            {
                name: 'address',
                type: 'address',
                value: 'GAXSFOOGF4ELO5HT5PTN23T5XE6D5QWL3YBHSVQ2HWOFEJNYYMRJENBV',
            },
        ],
    },
];
