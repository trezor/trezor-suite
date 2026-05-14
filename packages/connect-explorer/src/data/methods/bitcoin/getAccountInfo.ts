import { select } from './common';

const name = 'getAccountInfo';

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
        type: 'input-long',
        optional: true,
        value: ``,
    },
    {
        name: 'path',
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
        type: 'input-long',
        value: ``,
    },
];

export default [
    {
        name,
        submitButton: 'Get account info',

        fields: usingPath,
    },
    {
        name,
        submitButton: 'Get account info',

        fields: usingAddress,
    },
    {
        name,
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
        name,
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
        name,
        submitButton: 'Get account info',

        fields: [
            ...batch,
            {
                name: 'details',
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
                name: 'from',
                type: 'number',
                optional: true,
                value: ``,
            },
            {
                name: 'to',
                type: 'number',
                optional: true,
                value: ``,
            },
        ],
    },
];
