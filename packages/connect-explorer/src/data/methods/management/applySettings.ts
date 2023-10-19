const name = 'applySettings';
const docs = 'methods/applySettings.md';

export default [
    {
        docs,
        url: '/method/applySettings',
        name,
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
                    { value: 2, label: 'Host' },
                ],
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
                ],
            },
            {
                label: 'safety checks',
                name: 'safety_checks',
                type: 'select',
                optional: true,
                placeholder: 'Select',
                data: [
                    { value: 'Strict', label: 'Strict' },
                    { value: 'PromptAlways', label: 'PromptAlways' },
                    { value: 'PromptTemporarily', label: 'PromptTemporarily' },
                ],
            },
            // todo: add homescreen (type bytes)
        ],
    },
];
