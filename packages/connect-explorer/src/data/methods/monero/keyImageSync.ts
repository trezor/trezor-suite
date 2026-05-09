const name = 'moneroKeyImageSync';

const tdiFields = [
    {
        name: 'out_key',
        type: 'input',
        value: 'abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890',
    },
    {
        name: 'tx_pub_key',
        type: 'input',
        value: 'fedcba0987654321fedcba0987654321fedcba0987654321fedcba0987654321',
    },
    {
        name: 'additional_tx_pub_keys',
        type: 'input',
        value: '',
        optional: true,
    },
    {
        name: 'internal_output_index',
        type: 'number',
        value: 0,
    },
    {
        name: 'sub_addr_major',
        type: 'number',
        value: 0,
        optional: true,
    },
    {
        name: 'sub_addr_minor',
        type: 'number',
        value: 0,
        optional: true,
    },
];

const fields = [
    {
        name: 'path',
        type: 'input',
        value: `m/44'/128'/0'`,
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
    },
    {
        name: 'tdis',
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
        name,
        submitButton: 'Sync key images',
        fields,
    },
];
