import { select } from './common';

const name = 'getAccountInfo';
const docs = 'methods/getAccountInfo.md';

const batch = [
    {
        name: 'coin',
        type: 'select',
        value: 'test',
        affect: 'path',
        data: select,
    },
    {
        name: 'descriptor',
        label: 'Public key',
        type: 'input-long',
        optional: true,
        value: ``,
    },
    {
        name: 'path',
        label: 'OR Bip44 path',
        type: 'input',
        optional: true,
        value: `m/84'/1'/0'`,
    },
];

const usingPath = [
    {
        name: 'coin',
        type: 'select',
        value: 'test',
        affect: 'path',
        data: select,
    },
    {
        name: 'path',
        label: 'Bip44 path',
        type: 'input',
        value: `m/84'/1'/0'`,
    },
];

const usingAddress = [
    {
        name: 'coin',
        type: 'select',
        value: 'test',
        data: select,
    },
    {
        name: 'descriptor',
        label: 'Public key',
        type: 'input-long',
        value: ``,
    },
];

export default [
    {
        url: '/method/getAccountInfo',
        name,
        docs,
        submitButton: 'Get account info',

        fields: usingPath,
    },
    {
        url: '/method/getAccountInfo-xpub',
        name,
        docs,
        submitButton: 'Get account info',

        fields: usingAddress,
    },
    {
        url: '/method/getAccountInfo-bundle',
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
        url: '/method/getAccountInfo-discovery',
        name,
        docs,
        submitButton: 'Get account info',

        fields: [
            {
                name: 'coin',
                type: 'select',
                value: 'test',
                data: select,
            },
        ],
    },
    {
        url: '/method/getAccountInfo-advanced',
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
                    { value: 'tokens', label: 'Tokens (Account addresses)' },
                    {
                        value: 'tokenBalances',
                        label: 'Tokens with balances (Addresses with balances)',
                    },
                    { value: 'txs', label: 'Transactions' },
                ],
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
