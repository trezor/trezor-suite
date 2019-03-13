/* @flow */

import { select } from './common';

export default [
    {
        url: '/method/ripplePushTransaction',
        name: 'pushTransaction',
        docs: 'methods/pushTransaction.md',
        submitButton: 'Push transaction',

        fields: [
            {
                name: 'coin',
                type: 'select',
                value: 'xrp',
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
]