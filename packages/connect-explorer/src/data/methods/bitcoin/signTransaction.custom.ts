import { select } from './common';

const name = 'signTransaction';
const docs = 'methods/signTransaction.md';

export default [
    {
        url: '/method/signTransaction-custom',
        name,
        docs,
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
                label: 'Version group id',
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
                label: 'Branch id',
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
                label: 'Push transaction',
                type: 'checkbox',
                defaultValue: false,
                value: false,
            },
            {
                name: 'chunkify',
                label: 'Display recipient address in chunks of 4 characters',
                type: 'checkbox',
                value: false,
            },
            {
                name: 'amountUnit',
                label: 'Display amount in units',
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
