/* @flow */

const name = 'blockchainSubscribe';
const docs = 'methods/blockchainSubscribe.md';

const select = [
    { value: 'xrp', label: 'Ripple' },
    { value: 'txrp', label: 'Ripple Testnet' },
    { value: 'test', label: 'Bitcoin Testnet' },
    { value: 'dash', label: 'Dash' },
    { value: 'doge', label: 'Doge' },
    { value: 'btc', label: 'Bitcoin' },
    { value: 'bch', label: 'Bitcoin Cash' },
    { value: 'btg', label: 'Bitcoin Gold' },
    { value: 'dgb', label: 'Digibyte' },
    { value: 'nmc', label: 'Namecoin' },
    { value: 'zec', label: 'Zcash' },
    { value: 'vtc', label: 'Vertcoin' },
    { value: 'eth', label: 'Ethereum' },
    { value: 'etc', label: 'Ethereum Classic' },
    { value: 'trop', label: 'Ropsten' },
];

// const json = `[
//     {
//         descriptor: 'rBdHGo5fksQotC4x5t7BtaR8vMW5EDqk6S',
//     },
//     {
//         descriptor: 'rNaqKtKrMSwpwZSzRckPf7S96DkimjkF4H',
//     },
//     {
//         descriptor: 'rBKz5MC2iXdoS3XgnNSYmF69K1Yo4NS3Ws',
//     }
// ]`;
const json = `[
    {
        descriptor: 'rPVMhWBsfF9iMXYj3aAzJVkPDTFNSyWdKy',
    },
]`;
const estimateFeeRequest1 = `{
    blocks: [1],
    specific: {
        from: '0x4ac95f18819c17c4b69fa07086e46ff2d098a9cc',
        to: '0x419c4db4b9e25d6db2ad9691ccb832c8d9fda05e',
    }
    feeLevels: 'smart',
}`;
const estimateFeeRequest = `{
    feeLevels: 'smart',
}`;

export default [
    {
        url: '/method/blockchainSubscribe',
        name,
        docs,
        submitButton: 'Subscribe',
        fields: [
            {
                name: 'coin',
                type: 'select',
                value: 'xrp',
                data: select,
            },
            {
                name: 'accounts',
                label: 'Account descriptor',
                type: 'json',
                value: json,
            },
        ]
    },
    {
        url: '/method/blockchainUnsubscribe',
        name: 'blockchainUnsubscribe',
        docs,
        submitButton: 'Unsubscribe',
        fields: [
            {
                name: 'coin',
                type: 'select',
                value: 'xrp',
                data: select,
            },
            {
                name: 'accounts',
                label: 'Account descriptor',
                optional: true,
                type: 'json',
                value: json,
            },
        ]
    },
    {
        url: '/method/blockchainEstimateFee',
        name: 'blockchainEstimateFee',
        docs,
        submitButton: 'Estimate',
        fields: [
            {
                name: 'coin',
                type: 'select',
                value: 'btc',
                data: select,
            },
            {
                name: 'request',
                label: 'Request',
                optional: true,
                type: 'json',
                value: estimateFeeRequest,
            },
        ]
    },
    {
        url: '/method/blockchainGetTransactions',
        name: 'blockchainGetTransactions',
        docs,
        submitButton: 'Get transactions',
        fields: [
            {
                name: 'coin',
                type: 'select',
                value: 'test',
                data: select,
            },
            {
                name: 'txs',
                type: 'json',
                value: `['f457a1b85f84dcdaadc06f5dffb1436034bf6fa69a271a08d005f0a65aea7693']`,
            },
        ]
    },
    {
        url: '/method/blockchainDisconnect',
        name: 'blockchainDisconnect',
        docs,
        submitButton: 'Disconnect',
        fields: [
            {
                name: 'coin',
                type: 'select',
                value: 'xrp',
                data: select,
            },
        ]
    },
]