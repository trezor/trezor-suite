import { networks } from './common';

const name = 'nemGetAddress';
const docs = 'methods/nemGetAddress.md';
const batch = [
    {
        name: 'network',
        type: 'hidden',
        optional: true,
    },
    {
        name: 'networkSelect',
        label: 'network',
        type: 'select',
        value: 0,
        omit: true,
        affect: 'network',
        data: networks,
    },
    {
        name: 'path',
        label: 'Bip44 path',
        type: 'input',
        value: `m/44'/43'/0'`,
    },
    {
        name: 'showOnTrezor',
        label: 'Show on Trezor',
        type: 'checkbox',
        value: true,
    },
    {
        name: 'chunkify',
        label: 'Display address in chunks of 4 characters',
        type: 'checkbox',
        value: false,
    },
];

export default [
    {
        url: '/method/nemGetAddress',
        name,
        docs,
        submitButton: 'Get address',

        fields: batch,
    },

    {
        url: '/method/nemGetAddress-multiple',
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
        ],
    },
];
