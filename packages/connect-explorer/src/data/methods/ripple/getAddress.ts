const name = 'rippleGetAddress';
const batch = [
    {
        name: 'path',
        type: 'input',
        value: `m/44'/144'/0'/0/0`,
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
        submitButton: 'Get address',

        fields: batch,
    },

    {
        name,
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
