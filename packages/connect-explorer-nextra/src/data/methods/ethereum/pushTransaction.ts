import { select } from './common';

export default [
    {
        url: '/method/ethereumPushTransaction',
        name: 'pushTransaction',
        docs: 'methods/pushTransaction.md',
        submitButton: 'Push transaction',

        fields: [
            {
                name: 'coin',
                type: 'select',
                value: 'eth',
                data: select,
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
