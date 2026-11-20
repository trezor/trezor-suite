import { select } from './common';

const name = 'signTransaction';

const inputs = [
    {
        address_n: [(86 | 0x80000000) >>> 0, (1 | 0x80000000) >>> 0, (0 | 0x80000000) >>> 0, 0, 0],
        prev_hash: 'fb90e16223bff30dae007740fcf78e155bfa150cbc56b7e5da102eb60529005d',
        prev_index: 0,
        amount: '499838',
        script_type: 'SPENDTAPROOT',
    },
];

const outputs = [
    {
        address: 'tb1qldlynaqp0hy4zc2aag3pkenzvxy65saesxw3wd',
        amount: '100000',
        script_type: 'PAYTOADDRESS',
    },
    {
        address_n: [(86 | 0x80000000) >>> 0, (1 | 0x80000000) >>> 0, (0 | 0x80000000) >>> 0, 1, 0],
        amount: '398838',
        script_type: 'PAYTOTAPROOT',
    },
];

export default [
    {
        name,
        submitButton: 'Sign transaction',
        fields: [
            {
                name: 'coin',
                type: 'select',
                value: 'test',
                data: select,
            },
            {
                name: 'inputs',
                type: 'json',
                value: inputs,
            },
            {
                name: 'outputs',
                type: 'json',
                value: outputs,
            },
            {
                name: 'refTxs',
                type: 'json',
                optional: true,
                value: '',
            },
            {
                name: 'locktime',
                type: 'number',
                optional: true,
                value: '',
            },
            {
                name: 'timestamp',
                type: 'number',
                optional: true,
                value: '',
            },
            {
                name: 'version',
                type: 'number',
                optional: true,
                value: '',
            },
            {
                name: 'versionGroupId',
                type: 'number',
                optional: true,
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
                optional: true,
                value: '',
            },
            {
                name: 'expiry',
                type: 'number',
                optional: true,
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
                value: 0,
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
