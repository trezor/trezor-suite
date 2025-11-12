const name = 'moneroGetAddress';
const docs = 'methods/moneroGetAddress.md';
const batch = [
    {
        name: 'path',
        label: 'Bip44 path',
        type: 'input',
        value: `m/44'/128'/0'`,
    },
    {
        name: 'showOnTrezor',
        label: 'Show on Trezor',
        type: 'checkbox',
        value: true,
    },
    {
        name: 'networkType',
        label: 'Network Type',
        type: 'select',
        value: 0,
        data: [
            { value: 0, label: 'MAINNET' },
            { value: 1, label: 'TESTNET' },
            { value: 2, label: 'STAGENET' },
            { value: 3, label: 'FAKECHAIN' },
        ],
    },
    {
        name: 'account',
        label: 'Account index (optional)',
        type: 'number',
        value: 0,
    },
    {
        name: 'minor',
        label: 'Minor index (optional)',
        type: 'number',
        value: 0,
    },
    {
        name: 'paymentId',
        label: 'Payment ID (optional, hex)',
        type: 'input',
        value: '',
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
        url: '/method/moneroGetAddress',
        name,
        docs,
        submitButton: 'Get address',

        fields: batch,
    },

    {
        url: '/method/moneroGetAddress-multiple',
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
