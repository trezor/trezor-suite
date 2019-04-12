/* @flow */

const name = 'recoveryDevice';
const docs = 'methods/recoverDevice.md';

export default [
    {
        url: '/method/recoverDevice',
        name,
        // docs,
        submitButton: 'Recover device',
        fields: [
            {
                name: 'label',
                type: 'input',
                optional: true,
                value: 'My Trezor',
            },
            {
                name: 'word_count',
                label: 'word count',
                type: 'select',
                optional: false,
                value: 12,
                placeholder: 'Select',
                data: [
                    { value: 12, label: '12' },
                    { value: 18, label: '18' },
                    { value: 24, label: '24' }
                ]
            },
            {
                label: 'passphrase protection',
                name: 'passphrase_protection',
                type: 'checkbox',
                optional: true,
                defaultValue: false,
                value: false,
            },
            {
                label: 'pin protection',
                name: 'pin_protection',
                type: 'checkbox',
                optional: true,
                defaultValue: false,
                value: false,
            },
            {
                label: 'recovery type',
                name: 'type',
                type: 'select',
                value: 0,
                placeholder: 'Select',
                data: [
                    { value: 0, label: 'Scrambled words' },
                    { value: 1, label: 'Matrix' },
                ]
            },
            {
                label: 'dry run',
                name: 'dry_run',
                type: 'checkbox',
                optional: true,
                defaultValue: false,
                value: false,
            },
        ]
    },
]