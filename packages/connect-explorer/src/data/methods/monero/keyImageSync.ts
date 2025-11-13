const name = 'moneroKeyImageSync';
const docs = 'methods/moneroKeyImageSync.md';

const tdiFields = [
    {
        name: 'out_key',
        label: 'Output Key (hex)',
        type: 'input',
        value: 'abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890',
    },
    {
        name: 'tx_pub_key',
        label: 'Transaction Public Key (hex)',
        type: 'input',
        value: 'fedcba0987654321fedcba0987654321fedcba0987654321fedcba0987654321',
    },
    {
        name: 'additional_tx_pub_keys',
        label: 'Additional TX Public Keys (optional, comma-separated hex)',
        type: 'input',
        value: '',
        optional: true,
    },
    {
        name: 'internal_output_index',
        label: 'Internal Output Index',
        type: 'number',
        value: 0,
    },
    {
        name: 'sub_addr_major',
        label: 'Subaddress Major (optional)',
        type: 'number',
        value: 0,
        optional: true,
    },
    {
        name: 'sub_addr_minor',
        label: 'Subaddress Minor (optional)',
        type: 'number',
        value: 0,
        optional: true,
    },
];

const fields = [
    {
        name: 'path',
        label: 'Bip44 path',
        type: 'input',
        value: `m/44'/128'/0'`,
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
        name: 'tdis',
        label: 'Transfer Details (UTXOs)',
        type: 'array',
        batch: [
            {
                type: 'transfer-details',
                fields: tdiFields,
            },
        ],
        items: [tdiFields, tdiFields],
    },
];

export default [
    {
        url: '/method/moneroKeyImageSync',
        name,
        docs,
        submitButton: 'Sync key images',
        fields,
    },
];
