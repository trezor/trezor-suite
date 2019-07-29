/* @flow */

import { select } from './common';

export default [
    {
        url: '/method/ethereumSignMessage',
        name: 'ethereumSignMessage',
        docs: 'methods/ethereumSignMessage.md',
        submitButton: 'Sign message',

        fields: [
            {
                name: 'path',
                label: 'Bip44 path',
                type: 'input',
                value: `m/44'/60'/0'/0/0`,
            },
            {
                name: 'message',
                type: 'textarea',
                value: 'Example message',
            },
            {
                name: 'hex',
                label: 'Convert message from hex',
                type: 'checkbox',
                defaultValue: false,
                value: false,
            },
        ]
    },
]