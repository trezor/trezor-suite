const name = 'ethereumGetAddress';
const docs = 'methods/ethereumGetAddress.md';
const batch = [
    {
        name: 'path',
        label: 'Bip44 path',
        type: 'input',
        value: `m/44'/60'/0'/0/0`,
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
        url: '/method/ethereumGetAddress',
        name,
        docs,
        submitButton: 'Get address',

        fields: batch,
    },

    {
        url: '/method/ethereumGetAddress-multiple',
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
];
