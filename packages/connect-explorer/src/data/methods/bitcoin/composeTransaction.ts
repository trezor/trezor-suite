import { select } from './common';

const examples = {
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
    btg: [
        {
            amount: '20000',
            address: 'AXibjT5r96ZaVA8Lu4BQZocdTx7p5Ud8ZP',
        },
    ],
    ltc: [
        {
            amount: '20000',
            address: 'MUbHn23ZL733kCUbvQ88ZhVSWMdFQMEoV8',
        },
    ],
    dash: [
        {
            amount: '20000',
            address: 'XdTw4G5AWW4cogGd7ayybyBNDbuB45UpgH',
        },
    ],
    zcash: [
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
                    const example = examples[v.value as keyof typeof examples];

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
