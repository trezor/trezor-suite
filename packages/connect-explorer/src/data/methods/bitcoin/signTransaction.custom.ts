import { select } from './common';

const name = 'signTransaction';

export default [
    {
        name,
        submitButton: 'Sign transaction',
        fields: [
            {
                name: 'coin',
                type: 'select',
                value: 'btc',
                data: select,
            },
            {
                name: 'inputs',
                type: 'json',
                value: '[]',
            },
            {
                name: 'outputs',
                type: 'json',
                value: '[]',
            },
            {
                name: 'refTxs',
                type: 'json',
                value: '[]',
            },
            {
                name: 'locktime',
                type: 'number',
                value: '',
            },
            {
                name: 'timestamp',
                type: 'number',
                value: '',
            },
            {
                name: 'version',
                type: 'number',
                value: '',
            },
            {
                name: 'versionGroupId',
                type: 'number',
                defaultValue: '',
                value: '',
            },
            {
                name: 'overwintered',
                type: 'checkbox',
                defaultValue: false,
                value: false,
            },
            {
                name: 'branchId',
                type: 'number',
                defaultValue: '',
                value: '',
            },
            {
                name: 'expiry',
                type: 'number',
                value: '',
            },
            {
                name: 'push',
                type: 'checkbox',
                defaultValue: false,
                value: false,
            },
            {
                name: 'chunkify',
                type: 'checkbox',
                value: false,
            },
            {
                name: 'amountUnit',
                type: 'select',
                value: 'BITCOIN',
                data: [
                    { value: 0, label: 'BITCOIN (0)' },
                    { value: 1, label: 'MILLIBITCOIN (1)' },
                    { value: 2, label: 'MICROBITCOIN (2)' },
                    { value: 3, label: 'SATOSHI (3)' },
                ],
            },
        ],
    },
];
