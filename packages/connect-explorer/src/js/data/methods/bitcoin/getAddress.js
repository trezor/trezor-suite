/* @flow */

import { select } from './common';

const name = 'getAddress';
const docs = 'methods/getAddress.md';
const batch = [
    {
        name: 'path',
        label: 'Bip44 path',
        type: 'input',
        value: `m/49'/0'/0'`,
    },
    {
        name: 'coin',
        type: 'select',
        value: 'btc',
        affect: 'path',
        data: select.map(v => {
            return {
                ...v,
                affectedValue: `${v.affectedValue}/0/0`,
            }
        })
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
        url: '/method/getAddress',
        name,
        docs,
        submitButton: 'Get address',

        fields: batch,
    },

    {
        url: '/method/getAddress-multiple',
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
                items: [
                    batch,
                    batch,
                ]
            },
            // {
            //     name: 'message',
            //     type: 'function',
            //     value: 'function(){ console.log("ELO") }',
            // },
            
        ],
    },

    {
        url: '/method/getAddress-validation',
        name,
        docs,
        submitButton: 'Validate address',

        fields: [
            {
                name: 'path',
                label: 'Bip44 path',
                type: 'input',
                value: `m/49'/0'/0'`,
            },
            {
                name: 'address',
                type: 'address',
                value: '3L6TyTisPBmrDAj6RoKmDzNnj4eQi54gD2',
            },
            {
                name: 'coin',
                type: 'select',
                value: 'btc',
                affect: 'path',
                data: select.map(v => {
                    return {
                        ...v,
                        affectedValue: `${v.affectedValue}/0/0`,
                    }
                })
            },
        ],
    },
];