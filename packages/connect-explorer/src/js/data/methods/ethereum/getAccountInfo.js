const name = 'getAccountInfo';
const docs = 'methods/getAccountInfo.md';

export const select = [
    { value: 'eth', label: 'Ethereum', affectedValue: `m/44'/60'/0'/0/0` },
    { value: 'etc', label: 'Ethereum Classic', affectedValue: `m/44'/61'/0'/0/0` },
    { value: 'trop', label: 'Ropsten', affectedValue: `m/44'/60'/0'/0/0` },
    { value: 'btc', label: 'Bitcoin', affectedValue: `m/84'/0'/0'` },
    { value: 'test', label: 'Bitcoin Testnet', affectedValue: `m/49'/1'/0'` },
];

const batch = [
    {
        name: 'coin',
        type: 'select',
        value: 'trop',
        affect: 'path',
        data: select,
    },
    {
        name: 'descriptor',
        label: 'Ethereum address',
        type: 'input-long',
        optional: true,
        value: ``,
    },
    {
        name: 'path',
        label: 'OR Bip44 path',
        type: 'input',
        optional: true,
        value: `m/44'/144'/0'/0/0`,
    },
];

const usingPath = [
    {
        name: 'coin',
        type: 'select',
        value: 'trop',
        affect: 'path',
        data: select,
    },
    {
        name: 'path',
        label: 'Bip44 path',
        type: 'input',
        value: `m/44'/144'/0'/0/0`,
    },
];

const usingAddress = [
    {
        name: 'coin',
        type: 'select',
        value: 'trop',
        data: select,
    },
    {
        name: 'descriptor',
        label: 'Ethereum address',
        type: 'input-long',
        value: ``,
    },
];

export default [
    {
        url: '/method/ethereumGetAccountInfo',
        name,
        docs,
        submitButton: 'Get account info',

        fields: usingPath,
    },
    {
        url: '/method/ethereumGetAccountInfo-address',
        name,
        docs,
        submitButton: 'Get account info',

        fields: usingAddress,
    },
    {
        url: '/method/ethereumGetAccountInfo-bundle',
        name,
        docs,
        submitButton: 'Get multiple accounts',

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
                items: [
                    batch,
                ]
            },
        ],
    },
    {
        url: '/method/ethereumGetAccountInfo-discovery',
        name,
        docs,
        submitButton: 'Get account info',

        fields: [
            {
                name: 'coin',
                type: 'select',
                value: 'trop',
                data: select,
            }
        ],
    },
    {
        url: '/method/ethereumGetAccountInfo-advanced',
        name,
        docs,
        submitButton: 'Get account info',

        fields: [
            ...batch,
            {
                name: 'details',
                placeholder: 'Select details',
                type: 'select',
                optional: true,
                data: [
                    { value: 'basic', label: 'Basic' },
                    { value: 'tokens', label: 'Tokens' },
                    { value: 'tokenBalances', label: 'Tokens with balances' },
                    { value: 'txs', label: 'Transactions' },
                ]
            },
            {
                name: 'page',
                type: 'number',
                optional: true,
                value: ``,
            },
            {
                name: 'pageSize',
                type: 'number',
                optional: true,
                value: ``,
            },
            {
                name: 'contractFilter',
                type: 'input-long',
                optional: true,
                value: ``,
            },
            {
                name: 'gap',
                type: 'number',
                optional: true,
                value: ``,
            },
            {
                label: 'From block',
                name: 'from',
                type: 'number',
                optional: true,
                value: ``,
            },
            {
                label: 'To block',
                name: 'to',
                type: 'number',
                optional: true,
                value: ``,
            },
        ],

    },
];