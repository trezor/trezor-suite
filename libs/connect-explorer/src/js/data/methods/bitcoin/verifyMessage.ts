import { select } from './common';

export default [
    {
        url: '/method/verifyMessage',
        name: 'verifyMessage',
        docs: 'methods/verifyMessage.md',
        submitButton: 'Verify message',

        fields: [
            {
                name: 'coin',
                type: 'select',
                value: 'btc',
                data: select,
            },
            {
                name: 'address',
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
        ],
    },
];
