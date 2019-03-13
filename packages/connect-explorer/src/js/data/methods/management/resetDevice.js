/* @flow */

const name = 'resetDevice';
const docs = 'methods/resetDevice.md';

export default [
    {
        url: '/method/resetDevice',
        name,
        // docs,
        submitButton: 'Reset device',
        fields: [
            {
                name: 'label',
                type: 'input',
                optional: true,
                value: '',
            },
            {
                name: 'pinProtection',
                type: 'checkbox',
                defaultValue: false,
                value: false,
            },
            {
                name: 'passphraseProtection',
                type: 'checkbox',
                defaultValue: false,
                value: false,
            },
            {
                name: 'skipBackup',
                type: 'checkbox',
                defaultValue: false,
                value: false,
            },
            {
                name: 'noBackup',
                type: 'checkbox',
                defaultValue: false,
                value: false,
            },
        ]
    },
]