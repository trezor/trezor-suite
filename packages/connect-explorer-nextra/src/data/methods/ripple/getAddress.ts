const name = 'rippleGetAddress';
const docs = 'methods/rippleGetAddress.md';
const batch = [
    {
        name: 'path',
        label: 'Bip44 path',
        type: 'input',
        value: `m/44'/144'/0'/0/0`,
    },
    {
        name: 'showOnTrezor',
        label: 'Show on Trezor',
        type: 'checkbox',
        value: true,
    },
    {
        name: 'chunkify',
        label: 'Display address in chunks of 4 characters',
        type: 'checkbox',
        value: false,
    },
];

export default [
    {
        url: '/method/rippleGetAddress',
        name,
        docs,
        submitButton: 'Get address',

        fields: batch,
    },

    {
        url: '/method/rippleGetAddress-multiple',
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
