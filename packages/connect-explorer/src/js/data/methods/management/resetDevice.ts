const name = 'resetDevice';
const docs = 'methods/resetDevice.md';

export default [
    {
        url: '/method/resetDevice',
        name,
        docs,
        submitButton: 'Reset device',
        fields: [
            {
                name: 'label',
                label: 'Label',
                type: 'input',
                optional: true,
                value: 'Meow trezor',
            },
            {
                name: 'pin_protection',
                label: 'Pin protection',
                type: 'checkbox',
                defaultValue: false,
                value: false,
            },
            {
                name: 'passphrase_protection',
                label: 'Passphrase protection',
                type: 'checkbox',
                defaultValue: false,
                value: false,
            },
            {
                name: 'skip_backup',
                label: 'Skip backup',
                type: 'checkbox',
                defaultValue: false,
                value: true,
            },
            {
                name: 'no_backup',
                label: 'No backup',
                type: 'checkbox',
                defaultValue: false,
                value: false,
            },
        ],
    },
];
