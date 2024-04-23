import { cardanoDerivationType } from './common';

const name = 'getAccountInfo';
const docs = 'methods/getAccountInfo.md';

export default [
    {
        url: '/method/getAccountInfo-discovery-cardano',
        name,
        docs,
        submitButton: 'Get account info',

        fields: [
            {
                name: 'coin',
                type: 'select',
                value: 'test',
                data: [
                    { value: 'ada', label: 'Cardano' },
                    { value: 'tada', label: 'Cardano Testnet' },
                ],
            },
            {
                name: 'useCardanoDerivation',
                type: 'boolean',
                value: true,
            },
            cardanoDerivationType,
            {
                name: 'details',
                placeholder: 'Select details',
                type: 'select',
                optional: true,
                data: [
                    { value: 'basic', label: 'Basic' },
                    { value: 'txs', label: 'Transactions' },
                ],
            },
        ],
    },
];
