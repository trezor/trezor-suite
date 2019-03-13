/* @flow */

import { select, xpubs } from './common';

const name = 'getAccountInfo';
const docs = 'methods/getAccountInfo.md';

export default [
    {
        url: '/method/getAccountInfo',
        name,
        docs,
        submitButton: 'Get account info',

        fields: [
            {
                name: 'coin',
                type: 'select',
                value: 'btc',
                affect: 'path',
                data: [
                    ...select,
                ]
            },
            {
                name: 'path',
                label: 'Bip44 path',
                type: 'input',
                value: `m/49'/0'/0'`,
            },
        ],
    },
    {
        url: '/method/getAccountInfo-xpub',
        name,
        docs,
        submitButton: 'Get account info',

        fields: [
            {
                name: 'coin',
                type: 'select',
                value: 'btc',
                affect: 'xpub',
                data: select.map((v, i) => {
                    return {
                        ...v,
                        affectedValue: xpubs[i],
                    }
                })
            },
            {
                name: 'xpub',
                label: 'Bip44 path',
                type: 'input-long',
                value: 'ypub6XKbB5DSkq8Royg8isNtGktj6bmEfGJXDs83Ad5CZ5tpDV8QofwSWQFTWP2Pv24vNdrPhquehL7vRMvSTj2GpKv6UaTQCBKZALm6RJAmxG6',
            },
        ],
    },
    {
        url: '/method/getAccountInfo-discovery',
        name,
        docs,
        submitButton: 'Get account info',

        fields: [
            {
                name: 'coin',
                type: 'select',
                value: 'btc',
                data: [
                    ...select,
                ]
            },
        ],
    },
]