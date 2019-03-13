/* @flow */

export default [
    {
        url: '/method/liskSignMessage',
        name: 'liskSignMessage',
        docs: 'methods/liskSignMessage.md',
        submitButton: 'Sign message',

        fields: [
            {
                name: 'path',
                label: 'Bip44 path',
                type: 'input',
                value: `m/44'/134'/0'`,
            },
            {
                name: 'message',
                type: 'textarea',
                value: 'Example message',
            },
        ]
    },
]