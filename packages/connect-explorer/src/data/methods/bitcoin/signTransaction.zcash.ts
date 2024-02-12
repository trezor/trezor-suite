import { select } from './common';

const name = 'signTransaction';
const docs = 'methods/signTransaction.md';

export default [
    {
        url: '/method/signTransaction-zcash',
        name,
        docs,
        submitButton: 'Sign transaction',
        fields: [
            {
                name: 'coin',
                type: 'hidden',
                value: 'zcash',
                data: select,
            },
            {
                name: 'inputs',
                type: 'json',
                value: [
                    {
                        address_n: [
                            (44 | 0x80000000) >>> 0,
                            (133 | 0x80000000) >>> 0,
                            (0 | 0x80000000) >>> 0,
                            0,
                            0,
                        ],
                        prev_hash:
                            '4264f5f339c9fd498976dabb6d7b8819e112d25a0c1770a0f3ee81de525de8f8',
                        prev_index: 0,
                        amount: '118540',
                    },
                ],
            },
            {
                name: 'outputs',
                type: 'json',
                value: [
                    {
                        address: 't1fT6Zv1LcPwSwausNAuYGdewv2Mke3nrYo',
                        amount: '118000',
                        script_type: 'PAYTOADDRESS',
                    },
                ],
            },
            {
                name: 'overwintered',
                type: 'checkbox',
                value: true,
            },
            {
                name: 'version',
                type: 'number',
                value: '4',
            },
            {
                name: 'versionGroupId',
                label: 'Version group id',
                type: 'number',
                value: '0x892f2085',
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
        ],
    },
];
