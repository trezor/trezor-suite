const name = 'solanaSignMessage';

export default [
    {
        name,
        submitButton: 'Sign message',
        fields: [
            {
                name: 'path',
                type: 'input',
                value: `m/44'/501'/0'/0'`,
            },
            {
                name: 'message',
                type: 'input-long',
                value: 'Hello, Trezor!',
            },
        ],
    },
];
