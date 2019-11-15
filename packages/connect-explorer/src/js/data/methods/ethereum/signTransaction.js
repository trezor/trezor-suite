/* @flow */

import { select } from './common';

const name = 'ethereumSignTransaction';
const docs = 'methods/ethereumSignTransaction.md';

const tx = `{
    nonce: '0x0',
    gasPrice: '0x14',
    gasLimit: '0x14',
    to: '0xd0d6d6c5fe4a677d343cc433536bb717bae167dd',
    chainId: 1,
    value: '0x0',
    data: '0xa9059cbb000000000000000000000000574bbb36871ba6b78e27f4b4dcfb76ea0091880b000000000000000000000000000000000000000000000000000000000bebc200',
}`;

export default [
    {
        url: '/method/ethereumSignTransaction',
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
                value: tx,
            },
        ]
    },
]