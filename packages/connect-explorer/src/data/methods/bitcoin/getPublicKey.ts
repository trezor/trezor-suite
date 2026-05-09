import { select } from './common';

const name = 'getPublicKey';
const batch = [
    {
        name: 'path',
        type: 'input',
        value: `m/49'/0'/0'`,
    },
    {
        name: 'showOnTrezor',
        type: 'checkbox',
        value: true,
    },
    {
        name: 'coin',
        optional: true,
        type: 'select',
        value: '',
        affect: 'path',
        data: [...select],
    },
];

export default [
    {
        name,
        submitButton: 'Get public key',

        fields: batch,
    },

    {
        name,
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
                items: [batch, batch],
            },
        ],
    },
];
