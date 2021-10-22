import { select } from './common';

const name = 'ethereumGetAddress';
const docs = 'methods/ethereumGetAddress.md';
const batch = [
    {
        name: 'path',
        label: 'Bip44 path',
        type: 'input',
        value: `m/44'/60'/0'/0/0`,
    },
    {
        name: 'showOnTrezor',
        label: 'Show on Trezor',
        type: 'checkbox',
        defaultValue: true,
        value: true,
    },
];

export default [
    {
        url: '/method/ethereumGetAddress',
        name,
        docs,
        submitButton: 'Get address',

        fields: batch,
    },

    {
        url: '/method/ethereumGetAddress-multiple',
        name,
        docs,
        submitButton: 'Get multiple addresses',

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
                items: [batch, batch],
            },
            // {
            //     name: 'message',
            //     type: 'function',
            //     value: 'function(){ console.log("ELO") }',
            // },
        ],
    },

    {
        url: '/method/ethereumGetAddress-validation',
        name,
        docs,
        submitButton: 'Validate address',

        fields: [
            {
                name: 'path',
                label: 'Bip44 path',
                type: 'input',
                value: `m/44'/60'/0'/0/0`,
            },
            {
                name: 'address',
                type: 'address',
                value: '0x73d0385F4d8E00C5e6504C6030F47BF6212736A8',
            },
        ],
    },
];
