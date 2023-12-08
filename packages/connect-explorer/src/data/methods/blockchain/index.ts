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
    { value: 'tsep', label: 'Sepolia' },
    { value: 'tgor', label: 'Goerli' },
    { value: 'thol', label: 'Holesky' },
    { value: 'sol', label: 'Solana' },
    { value: 'dsol', label: 'Solana devnet' },
];

const json = `[
    {
        descriptor: 'rPVMhWBsfF9iMXYj3aAzJVkPDTFNSyWdKy',
    },
]`;

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
        ],
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
        ],
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
        ],
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
        ],
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
        ],
    },
];
