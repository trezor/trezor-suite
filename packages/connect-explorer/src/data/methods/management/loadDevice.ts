const name = 'loadDevice';

export default [
    {
        name,
        submitButton: 'Load device',
        fields: [
            {
                name: 'mnemonics',
                type: 'input',
                optional: false,
                value: ['all all all all all all all all all all all all'],
            },
            {
                name: 'label',
                type: 'input',
                optional: true,
                value: 'Meow trezor',
            },
            {
                name: 'pin',
                type: 'input',
                optional: true,
            },
            {
                name: 'passphrase_protection',
                type: 'checkbox',
                optional: true,
            },
            {
                name: 'skip_checksum',
                type: 'checkbox',
                optional: true,
            },
            {
                name: 'u2f_counter',
                type: 'number',
                optional: true,
            },
            {
                name: 'no_backup',
                type: 'checkbox',
                optional: true,
            },
            {
                name: 'needs_backup',
                type: 'checkbox',
                optional: true,
            },
        ],
    },
];
