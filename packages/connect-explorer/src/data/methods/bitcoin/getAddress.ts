import { select } from './common';

const name = 'getAddress';
const batch = [
    {
        name: 'path',
        type: 'input',
        value: `m/49'/0'/0'`,
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
        name: 'showOnTrezor',
        type: 'checkbox',
        value: true,
    },
    {
        name: 'chunkify',
        type: 'checkbox',
        value: false,
    },
];

export default [
    {
        name,
        submitButton: 'Get address',

        fields: batch,
    },

    {
        name,
        submitButton: 'Get multiple addresses',

        fields: [
            {
                name: 'bundle',
                type: 'array',
                batch: [
                    {
                        type: 'doesnt-matter',
                        fields: batch,
                    },
                ],
                items: [batch, batch],
            },
        ],
    },
];
