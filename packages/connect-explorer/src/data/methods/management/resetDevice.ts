const name = 'resetDevice';

export default [
    {
        name,
        submitButton: 'Reset device',
        fields: [
            {
                name: 'label',
                type: 'input',
                optional: true,
                value: 'Meow trezor',
            },
            {
                name: 'pin_protection',
                type: 'checkbox',
                defaultValue: false,
                value: false,
            },
            {
                name: 'passphrase_protection',
                type: 'checkbox',
                defaultValue: false,
                value: false,
            },
            {
                name: 'skip_backup',
                type: 'checkbox',
                defaultValue: false,
                value: true,
            },
            {
                name: 'no_backup',
                type: 'checkbox',
                defaultValue: false,
                value: false,
            },
            {
                name: 'strength',
                type: 'select',
                optional: true,
                data: [
                    { value: 128, label: '128bit (12 words)' },
                    { value: 192, label: '192bit (18 words)' },
                    { value: 256, label: '256bit (24 words)' },
                ],
            },
        ],
    },
];
