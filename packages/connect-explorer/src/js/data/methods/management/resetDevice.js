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
                label: 'Label',
                type: 'input',
                optional: true,
                value: '',
            },
            {
                name: 'pinProtection',
                label: 'Pin protection',
                type: 'checkbox',
                defaultValue: false,
                value: false,
            },
            {
                name: 'passphraseProtection',
                label: 'Passphrase protection',
                type: 'checkbox',
                defaultValue: false,
                value: false,
            },
            {
                name: 'skipBackup',
                label: 'Skip backup',
                type: 'checkbox',
                defaultValue: false,
                value: false,
            },
            {
                name: 'noBackup',
                label: 'No backup',
                type: 'checkbox',
                defaultValue: false,
                value: false,
            },
        ]
    },
]