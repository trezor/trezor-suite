const name = 'pingDevice';

export default [
    {
        name,
        submitButton: 'Ping device',
        fields: [
            {
                name: 'message',
                type: 'textarea',
                optional: true,
                value: 'Hello Trezor',
            },
            {
                label: 'button protection',
                name: 'button_protection',
                type: 'checkbox',
                optional: true,
                value: false,
            },
        ],
    },
];
