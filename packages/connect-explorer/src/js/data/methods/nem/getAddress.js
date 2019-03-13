/* @flow */

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
        defaultValue: true,
        value: true,
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
                items: [
                    batch,
                    batch,
                ]
            },
        ],
    },

    {
        url: '/method/nemGetAddress-validation',
        name,
        docs,
        submitButton: 'Validate address',

        fields: [
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
                name: 'address',
                type: 'address',
                value: 'NDS7OQUHKNYMSC2WPJA6QUTLJIO22S27B6VKCG4A',
            },
        ],
    },
];