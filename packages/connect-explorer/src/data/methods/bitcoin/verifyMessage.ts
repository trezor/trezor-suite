import { select } from './common';

export default [
    {
        name: 'verifyMessage',
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
                value: '3AnYTd2FGxJLNKL1AzxfW3FJMntp9D2KKX',
            },
            {
                name: 'message',
                type: 'textarea',
                value: 'Example message',
            },
            {
                name: 'signature',
                type: 'textarea',
                value: 'I6BrpivjCwZmScZ6BMAHWGQPo+JjX2kzKXU5LcGVfEgvFb2VfJuKo3g6eSQcykQZiILoWNUDn5rDHkwJg3EcvuY=',
            },
        ],
    },
];
