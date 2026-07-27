export default [
    {
        name: 'ethereumSignMessage',
        submitButton: 'Sign message',

        fields: [
            {
                name: 'path',
                type: 'input',
                value: `m/44'/60'/0'/0/0`,
            },
            {
                name: 'message',
                type: 'textarea',
                value: 'Example message',
            },
            {
                name: 'hex',
                type: 'checkbox',
                defaultValue: false,
                value: false,
            },
        ],
    },
];
