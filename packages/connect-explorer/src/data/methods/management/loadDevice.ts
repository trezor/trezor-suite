const name = 'loadDevice';
const docs = 'methods/loadDevice.md';

export default [
    {
        url: '/method/loadDevice',
        name,
        docs,
        submitButton: 'Load device',
        fields: [
            {
                name: 'mnemonics',
                label: 'Mnemonics',
                type: 'input',
                optional: false,
                value: ['all all all all all all all all all all all all'],
            },
            {
                name: 'label',
                label: 'Label',
                type: 'input',
                optional: true,
                value: 'Meow trezor',
            },
            {
                name: 'pin',
                label: 'Pin',
                type: 'input',
                optional: true,
            },
            {
                name: 'passphrase_protection',
                label: 'Passphrase protection',
                type: 'checkbox',
                optional: true,
            },
            {
                name: 'skip_checksum',
                label: 'Skip checksum',
                type: 'checkbox',
                optional: true,
            },
            {
                name: 'u2f_counter',
                label: 'U2F counter',
                type: 'number',
                optional: true,
            },
            {
                name: 'no_backup',
                label: 'No backup',
                type: 'checkbox',
                optional: true,
            },
            {
                name: 'needs_backup',
                label: 'Needs backup',
                type: 'checkbox',
                optional: true,
            },
        ],
    },
];
