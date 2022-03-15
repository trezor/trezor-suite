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
                value: '010000000182488650ef25a58fef6788bd71b8212038d7f2bbe4750bc7bcb44701e85ef6d5000000006b4830450221009a0b7be0d4ed3146ee262b42202841834698bb3ee39c24e7437df208b8b7077102202b79ab1e7736219387dffe8d615bbdba87e11477104b867ef47afed1a5ede7810121023230848585885f63803a0a8aecdd6538792d5c539215c91698e315bf0253b43dffffffff0160cc0500000000001976a914de9b2a8da088824e8fe51debea566617d851537888ac00000000',
            },
        ],
    },
];
