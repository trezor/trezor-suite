const name = 'changeLanguage';
const docs = 'methods/changeLanguage.md';

export default [
    {
        docs,
        url: '/method/changeLanguage',
        name,
        submitButton: 'Change language',
        fields: [
            {
                name: 'language',
                label: 'Language',
                type: 'select',
                optional: false,
                placeholder: 'Select',
                data: [
                    { value: 'cs-CZ', label: 'cs-CZ' },
                    { value: 'de-DE', label: 'de-DE' },
                    { value: 'es-ES', label: 'es-ES' },
                    { value: 'fr-FR', label: 'fr-FR' },
                ],
            },
            {
                name: 'baseUrl',
                type: 'input',
                optional: true,
                value: 'https://data.trezor.io',
            },
        ],
    },
    {
        docs,
        url: '/method/changeLanguage-binary',
        name,
        submitButton: 'Change language',
        fields: [
            {
                name: 'binary',
                label: 'binary',
                optional: false,
                type: 'file',
            },
        ],
    },
];
