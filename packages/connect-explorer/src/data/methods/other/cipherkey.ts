const name = 'cipherKeyValue';

export default [
    {
        name,
        submitButton: 'Call',
        fields: [
            {
                name: 'path',
                type: 'input',
                value: `m/49'/1'/0'`,
            },
            {
                name: 'key',
                type: 'input-long',
                optional: true,
                value: 'This text is displayed on Trezor during encrypt',
            },
            {
                name: 'value',
                type: 'input-long',
                optional: true,
                value: '1c0ffeec0ffeec0ffeec0ffeec0ffee1',
            },
            {
                name: 'encrypt',
                type: 'checkbox',
                defaultValue: true,
                value: true,
            },
            {
                name: 'askOnEncrypt',
                type: 'checkbox',
                defaultValue: false,
                value: true,
            },
            {
                name: 'askOnDecrypt',
                type: 'checkbox',
                defaultValue: false,
                value: true,
            },
            {
                name: 'iv',
                optional: true,
                type: 'input-long',
                value: '',
            },
        ],
    },
];
