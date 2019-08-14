/* @flow */

const name = 'binanceSignTransaction';
const docs = 'methods/binanceSignTransaction.md';
const transfer = `{
    chain_id: 'Binance-Chain-Nile',
    account_number: 34,
    memo: 'test',
    sequence: 31,
    source: 1,
    transfer: {
        inputs: [
            {
                address: 'tbnb1hgm0p7khfk85zpz5v0j8wnej3a90w709zzlffd',
                coins: [
                    { amount: 1000000000, denom: 'BNB' },
                ],
            },
        ],
        outputs: [
            {
                address: 'tbnb1ss57e8sa7xnwq030k2ctr775uac9gjzglqhvpy',
                coins: [
                    { amount: 1000000000, denom: 'BNB' },
                ],
            },
        ],
    },
}`;

const placeOrder = `{
    chain_id: 'Binance-Chain-Nile',
    account_number: 34,
    memo: '',
    sequence: 32,
    source: 1,
    placeOrder: {
        id: 'BA36F0FAD74D8F41045463E4774F328F4AF779E5-33',
        ordertype: 2,
        price: 100000000,
        quantity: 100000000,
        sender: 'tbnb1hgm0p7khfk85zpz5v0j8wnej3a90w709zzlffd',
        side: 1,
        symbol: 'ADA.B-B63_BNB',
        timeinforce: 1,
    },
}`;

const cancelOrder = `{
    chain_id: 'Binance-Chain-Nile',
    account_number: 34,
    memo: '',
    sequence: 33,
    source: 1,
    cancelOrder: {
        refid: 'BA36F0FAD74D8F41045463E4774F328F4AF779E5-29',
        sender: 'tbnb1hgm0p7khfk85zpz5v0j8wnej3a90w709zzlffd',
        symbol: 'BCHSV.B-10F_BNB',
    },
}`;

export default [
    {
        url: '/method/binanceSignTransaction-transfer',
        name,
        docs,
        submitButton: 'Sign transaction',
        fields: [
            {
                name: 'path',
                label: 'Bip44 path',
                type: 'input',
                value: `m/44'/714'/0'/0/0`,
            },
            {
                name: 'transaction',
                type: 'json',
                value: transfer
            },
        ]
    },
    {
        url: '/method/binanceSignTransaction-placeorder',
        name,
        docs,
        submitButton: 'Sign transaction',
        fields: [
            {
                name: 'path',
                label: 'Bip44 path',
                type: 'input',
                value: `m/44'/714'/0'/0/0`,
            },
            {
                name: 'transaction',
                type: 'json',
                value: placeOrder
            },
        ]
    },
    {
        url: '/method/binanceSignTransaction-cancelorder',
        name,
        docs,
        submitButton: 'Sign transaction',
        fields: [
            {
                name: 'path',
                label: 'Bip44 path',
                type: 'input',
                value: `m/44'/714'/0'/0/0`,
            },
            {
                name: 'transaction',
                type: 'json',
                value: cancelOrder
            },
        ]
    },
]