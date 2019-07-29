/* @flow */

const name = 'rippleGetAddress';
const docs = 'methods/rippleGetAddress.md';
const batch = [
    {
        name: 'path',
        label: 'Bip44 path',
        type: 'input',
        value: `m/44'/144'/0'/0/0`,
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
        url: '/method/rippleGetAddress',
        name,
        docs,
        submitButton: 'Get address',

        fields: batch,
    },

    {
        url: '/method/rippleGetAddress-multiple',
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
        url: '/method/rippleGetAddress-validation',
        name,
        docs,
        submitButton: 'Validate address',

        fields: [
            {
                name: 'path',
                label: 'Bip44 path',
                type: 'input',
                value: `m/44'/144'/0'/0/0`,
            },
            {
                name: 'address',
                type: 'address',
                value: 'rNaqKtKrMSwpwZSzRckPf7S96DkimjkF4H',
            },
        ],
    },
];