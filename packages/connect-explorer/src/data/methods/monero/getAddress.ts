const name = 'moneroGetAddress';
const batch = [
    {
        name: 'path',
        type: 'input',
        value: `m/44'/128'/0'`,
    },
    {
        name: 'showOnTrezor',
        type: 'checkbox',
        value: true,
        optional: true,
    },
    {
        name: 'networkType',
        type: 'select',
        value: 0,
        data: [
            { value: 0, label: 'MAINNET' },
            { value: 1, label: 'TESTNET' },
            { value: 2, label: 'STAGENET' },
            { value: 3, label: 'FAKECHAIN' },
        ],
        optional: true,
    },
    {
        name: 'account',
        type: 'number',
        value: 0,
        optional: true,
    },
    {
        name: 'minor',
        type: 'number',
        value: 0,
        optional: true,
    },
    {
        name: 'paymentId',
        type: 'input',
        value: '',
        optional: true,
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
