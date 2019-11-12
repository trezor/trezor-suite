const name = 'cipherKeyValue';
const docs = 'methods/cipherKeyValue.md';

export default [
    {
        url: '/method/cipherKeyValue',
        name,
        docs,
        submitButton: 'Call',
        fields: [
            {
                name: 'path',
                label: 'Bip44 path',
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
                label: 'Encrypt',
                type: 'checkbox',
                defaultValue: true,
                value: true,
            },
            {
                name: 'askOnEncrypt',
                label: 'Ask on encrypt',
                type: 'checkbox',
                defaultValue: false,
                value: true,
            },
            {
                name: 'askOnDecrypt',
                label: 'Ask on decrypt',
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
