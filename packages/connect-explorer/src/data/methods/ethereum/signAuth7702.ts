export default [
    {
        name: 'ethereumSignAuth7702',
        submitButton: 'Sign authorization',

        fields: [
            {
                name: 'path',
                type: 'input',
                value: `m/44'/60'/0'/0/0`,
            },
            {
                name: 'chainId',
                type: 'number',
                value: '1',
            },
            {
                // MetaMask delegate, one of the contracts allowed by firmware. Use the zero
                // address to revoke an existing delegation instead.
                name: 'delegate',
                type: 'input',
                value: '0x63c0c19a282a1b52b07dd5a65b58948a07dae32b',
            },
            {
                name: 'nonce',
                type: 'number',
                value: '0',
            },
            {
                name: '__experimental',
                type: 'checkbox',
                value: true,
            },
        ],
    },
];
