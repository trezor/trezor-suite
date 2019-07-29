/* @flow */

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
                data: [
                    ...select,
                    // { value: 'etc', label: 'Ethereum' },
                    // { value: 'eth', label: 'Ethereum Classic' },
                    // { value: 'xrp', label: 'Ripple' },
                    // { value: 'txrp', label: 'Ripple Testnet' },
                ]
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