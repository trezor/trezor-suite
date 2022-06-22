const name = 'getAccountInfo';
const docs = 'methods/getAccountInfo.md';

export const select = [
    { value: 'xrp', label: 'Ripple', affectedValue: `m/44'/144'/0'/0/0` },
    { value: 'txrp', label: 'Ripple Testnet', affectedValue: `m/44'/144'/0'/0/0` },
];

const batch = [
    {
        name: 'coin',
        type: 'select',
        value: 'txrp',
        affect: 'path',
        data: select,
    },
    {
        name: 'descriptor',
        label: 'Ripple address',
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
        value: 'txrp',
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
        value: 'txrp',
        data: select,
    },
    {
        name: 'descriptor',
        label: 'Ripple address',
        type: 'input-long',
        value: ``,
    },
];

export default [
    {
        url: '/method/rippleGetAccountInfo',
        name,
        docs,
        submitButton: 'Get account info',

        fields: usingPath,
    },
    {
        url: '/method/rippleGetAccountInfo-address',
        name,
        docs,
        submitButton: 'Get account info',

        fields: usingAddress,
    },
    {
        url: '/method/rippleGetAccountInfo-bundle',
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
                items: [batch],
            },
        ],
    },
    {
        url: '/method/rippleGetAccountInfo-discovery',
        name,
        docs,
        submitButton: 'Get account info',

        fields: [
            {
                name: 'coin',
                type: 'select',
                value: 'txrp',
                data: select,
            },
        ],
    },
    {
        url: '/method/rippleGetAccountInfo-advanced',
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
                    { value: 'txs', label: 'Transactions' },
                ],
            },
            {
                name: 'pageSize',
                type: 'number',
                optional: true,
                value: ``,
            },
            {
                name: 'marker',
                type: 'json',
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
