import { select } from './common';

export default [
    {
        name: 'signMessage',
        submitButton: 'Sign message',

        fields: [
            {
                name: 'path',
                type: 'input',
                value: `m/49'/0'/0'/0/0`,
            },
            {
                name: 'coin',
                type: 'select',
                value: 'btc',
                affect: 'path',
                data: select.map(v => ({
                    ...v,
                    affectedValue: `${v.affectedValue}/0/0`,
                })),
            },
            {
                name: 'message',
                type: 'textarea',
                value: 'Example message',
            },
        ],
    },
];
