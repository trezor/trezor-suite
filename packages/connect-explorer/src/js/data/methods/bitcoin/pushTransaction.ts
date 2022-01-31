import { select } from './common';

export default [
    {
        url: '/method/pushTransaction',
        name: 'pushTransaction',
        docs: 'methods/pushTransaction.md',
        submitButton: 'Push transaction',

        fields: [
            {
                name: 'coin',
                type: 'select',
                value: 'btc',
                data: [...select],
            },
            {
                name: 'tx',
                label: 'Transaction',
                type: 'textarea',
                value: '',
            },
        ],
    },
];
