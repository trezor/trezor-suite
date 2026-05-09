const name = 'applySettings';

export default [
    {
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
                type: 'select',
                optional: true,
                data: [
                    { value: 0, label: 'Ask' },
                    { value: 1, label: 'Device' },
                    { value: 2, label: 'Host' },
                ],
            },
            {
                name: 'use_passphrase',
                type: 'checkbox',
                optional: true,
                value: false,
            },
            {
                name: 'auto_lock_delay_ms',
                type: 'number',
                value: '',
                optional: true,
            },
            {
                name: 'display_rotation',
                type: 'select',
                optional: true,
                data: [
                    { value: 0, label: '↑' },
                    { value: 90, label: '→' },
                    { value: 180, label: '↓' },
                    { value: 270, label: '←' },
                ],
            },
            {
                name: 'safety_checks',
                type: 'select',
                optional: true,
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
