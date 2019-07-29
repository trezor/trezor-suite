/* @flow */

import { select } from './common';

export default [
    {
        url: '/method/ethereumVerifyMessage',
        name: 'ethereumVerifyMessage',
        docs: 'methods/ethereumVerifyMessage.md',
        submitButton: 'Verify message',

        fields: [
            {
                name: 'coin',
                type: 'select',
                value: 'eth',
                data: select
            },
            {
                name: 'address',
                type: 'input-long',
                value: '',
            },
            
            {
                name: 'message',
                type: 'textarea',
                value: '',
            },
            {
                name: 'signature',
                type: 'textarea',
                value: '',
            },
            {
                name: 'hex',
                label: 'Convert message from hex',
                type: 'checkbox',
                optional: true,
                defaultValue: false,
                value: false,
            },
        ]
    },
]