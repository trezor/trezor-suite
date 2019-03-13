/* @flow */

import { select } from './common';

const name = 'getPublicKey';
const docs = 'methods/getPublicKey.md';
const batch = [
    {
        name: 'path',
        label: 'Bip44 path',
        type: 'input',
        value: `m/49'/0'/0'`,
    },
    {
        name: 'coin',
        optional: true,
        type: 'select',
        value: '',
        affect: 'path',
        data: [
            ...select,
        ]
    },
];

export default [
    {
        url: '/method/getPublicKey',
        name,
        docs,
        submitButton: 'Get public key',

        fields: batch,
    },

    {
        url: '/method/getPublicKey-multiple',
        name,
        docs,
        submitButton: 'Get multiple public keys',

        fields: [
            {
                name: 'bundle',
                type: 'array',
                batch: [
                    {
                        type: '',
                        fields: batch,
                    },
                ],
                items: [
                    batch,
                    batch,
                ]
            },
        ],
    },
];