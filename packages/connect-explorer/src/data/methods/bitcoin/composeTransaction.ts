import type { CoinSymbol } from '@trezor/connect-common';

import { select } from './common';

const examples: Partial<Record<CoinSymbol, Array<{ amount: string; address: string }>>> = {
    btc: [
        {
            amount: '498066',
            address: '3L6TyTisPBmrDAj6RoKmDzNnj4eQi54gD2',
        },
    ],
    test: [
        {
            amount: '2000',
            address: '2N4Q5FhU2497BryFfUgbqkAJE87aKHUhXMp',
        },
    ],
    bch: [
        {
            amount: '20000',
            address: 'bitcoincash:qrjgzvp26w92hgg06h69zxuarxtlsryzwg7wecq0mn',
        },
    ],
    ltc: [
        {
            amount: '20000',
            address: 'MUbHn23ZL733kCUbvQ88ZhVSWMdFQMEoV8',
        },
    ],
    zec: [
        {
            amount: '20000',
            address: 't1Lv2EguMkaZwvtFQW5pmbUsBw59KfTEhf4',
        },
    ],
    doge: [
        {
            amount: '20000',
            address: 'DUCd1B3YBiXL5By15yXgSLZtEkvwsgEdqS',
        },
    ],
};

export default [
    {
        name: 'composeTransaction',
        submitButton: 'Compose transaction',
        fields: [
            {
                name: 'coin',
                type: 'select',
                value: 'test',
                affect: 'outputs',
                data: select.map(v => {
                    const example = examples[v.value];

                    return {
                        ...v,
                        affectedValue: example || undefined,
                    };
                }),
            },
            {
                name: 'outputs',
                type: 'json',
                value: '',
            },
            {
                name: 'push',
                type: 'checkbox',
                defaultValue: false,
                value: false,
            },
        ],
    },
];
