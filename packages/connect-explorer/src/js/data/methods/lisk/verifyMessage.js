/* @flow */


export default [
    {
        url: '/method/liskVerifyMessage',
        name: 'liskVerifyMessage',
        docs: 'methods/liskVerifyMessage.md',
        submitButton: 'Verify message',

        fields: [
            {
                name: 'publicKey',
                type: 'input-long',
                value: '',
            },
            
            {
                name: 'message',
                type: 'textarea',
                value: '',
            },
            {
                name: 'signature',
                type: 'textarea',
                value: '',
            },
        ]
    },
]