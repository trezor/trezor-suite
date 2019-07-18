/* @flow */

const name = 'applySettings';
const docs = 'methods/applySettings.md';

export default [
    {
        url: '/method/applySettings',
        name,
        // docs,
        submitButton: 'Apply settings',
        fields: [
            {
                name: 'label',
                type: 'input',
                optional: true,
                value: 'My Trezor',
            },
            {
                name: 'passphrase_source',
                label: 'passphrase source',
                type: 'select',
                optional: true,
                placeholder: 'Select',
                data: [
                    { value: 0, label: 'Ask' },
                    { value: 1, label: 'Device' },
                    { value: 2, label: 'Host' }
                ]
            },
            {
                label: 'use passphrase',
                name: 'use_passphrase',
                type: 'checkbox',
                value: false,
            },
            {
                label: 'auto lock delay (ms)',
                name: 'auto_lock_delay_ms',
                type: 'number',
                value: '',
            },
            {
                label: 'display rotation',
                name: 'display_rotation',
                type: 'select',
                optional: true,
                placeholder: 'Select',
                data: [
                    { value: 0, label: '↑' },
                    { value: 90, label: '→' },
                    { value: 180, label: '↓' },
                    { value: 270, label: '←' },
                ]
            },
            // todo: add homescreen (type bytes)
        ]
    },
]