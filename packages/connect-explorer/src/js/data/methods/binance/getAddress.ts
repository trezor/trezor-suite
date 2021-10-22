const name = 'binanceGetAddress';
const docs = 'methods/binanceGetAddress.md';
const batch = [
    {
        name: 'path',
        label: 'Bip44 path',
        type: 'input',
        value: `m/44'/714'/0'/0/0`,
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
        url: '/method/binanceGetAddress',
        name,
        docs,
        submitButton: 'Get address',

        fields: batch,
    },

    {
        url: '/method/binanceGetAddress-multiple',
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

    {
        url: '/method/binanceGetAddress-validation',
        name,
        docs,
        submitButton: 'Validate address',

        fields: [
            {
                name: 'path',
                label: 'Bip44 path',
                type: 'input',
                value: `m/44'/714'/0'/0/0`,
            },
            {
                name: 'address',
                type: 'address',
                value: 'bnb1afwh46v6nn30nkmugw5swdmsyjmlxslgjfugre',
            },
        ],
    },
];
