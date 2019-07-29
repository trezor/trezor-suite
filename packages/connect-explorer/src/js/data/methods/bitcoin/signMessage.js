/* @flow */

import { select } from './common';

export default [
    {
        url: '/method/signMessage',
        name: 'signMessage',
        docs: 'methods/signMessage.md',
        submitButton: 'Sign message',

        fields: [
            {
                name: 'path',
                label: 'Bip44 path',
                type: 'input',
                value: `m/49'/0'/0'/0/0`,
            },
            {
                name: 'coin',
                type: 'select',
                value: 'btc',
                affect: 'path',
                data: select.map(v => {
                    return {
                        ...v,
                        affectedValue: `${v.affectedValue}/0/0`,
                    }
                })
            },
            {
                name: 'message',
                type: 'textarea',
                value: 'Example message',
            },
        ]
    },
]