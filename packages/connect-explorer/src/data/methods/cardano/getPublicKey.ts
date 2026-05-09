import { cardanoDerivationType } from './common';

const name = 'cardanoGetPublicKey';
const batch = [
    {
        name: 'path',
        type: 'input',
        value: `m/44'/1815'/0'`,
    },
    {
        name: 'showOnTrezor',
        type: 'checkbox',
        value: true,
    },
    cardanoDerivationType,
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
