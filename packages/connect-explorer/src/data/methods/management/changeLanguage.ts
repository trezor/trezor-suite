const name = 'changeLanguage';

export default [
    {
        name,
        submitButton: 'Change language',
        fields: [
            {
                name: 'language',
                type: 'select',
                optional: false,
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
        name,
        submitButton: 'Change language',
        fields: [
            {
                name: 'binary',
                optional: false,
                type: 'file',
            },
        ],
    },
];
