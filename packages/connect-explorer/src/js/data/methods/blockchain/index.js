/* @flow */

const name = 'blockchainSubscribe';
const docs = 'methods/blockchainSubscribe.md';

const select = [
    { value: 'xrp', label: 'Ripple' },
    { value: 'txrp', label: 'Ripple Testnet' },
    { value: 'test', label: 'Bitcoin Testnet' },
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
                value: 'xrp',
                data: select,
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