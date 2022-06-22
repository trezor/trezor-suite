import { select } from './common';

const name = 'ethereumSignTransaction';
const docs = 'methods/ethereumSignTransaction.md';

export default [
    {
        url: '/method/ethereumSignTransaction-erc20',
        name,
        docs,
        submitButton: 'Sign transaction',
        fields: [
            {
                name: 'path',
                label: 'Bip44 path',
                type: 'input',
                value: `m/44'/60'/0'/0/0`,
            },
            {
                name: 'transaction',
                type: 'json',
                value: '',
            },
        ],
    },
];
