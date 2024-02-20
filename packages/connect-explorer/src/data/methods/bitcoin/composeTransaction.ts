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
    nmc: [
        {
            amount: '20000',
            address: 'N4n9hyYH5EDfhmCRS3qqzh7crLbuXrku6d',
        },
    ],
    vtc: [
        {
            amount: '20000',
            address: '33GN5Aq3tqBbF3f2HBfCRZi6fyS3baEQWH',
        },
    ],
    cpc: [
        {
            amount: '20000',
            address: 'CMSgH7wq4kV9ogmSPB5rBmPceQJy3oA9Bu',
        },
    ],
};

export default [
    {
        url: '/method/composeTransaction',
        name: 'composeTransaction',
        docs: 'methods/composeTransaction.md',
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
                label: 'Push transaction',
                type: 'checkbox',
                defaultValue: false,
                value: false,
            },
        ],
    },
];
