const select = [
    { value: 'xrp', label: 'Ripple', affectedValue: `m/44'/144'/0'/0/0` },
    { value: 'txrp', label: 'Ripple Testnet', affectedValue: `m/44'/144'/0'/0/0` },
];

export default [
    {
        url: '/method/ripplePushTransaction',
        name: 'pushTransaction',
        docs: 'methods/pushTransaction.md',
        submitButton: 'Push transaction',

        fields: [
            {
                name: 'coin',
                type: 'select',
                value: 'txrp',
                data: select,
            },
            {
                name: 'tx',
                label: 'Transaction',
                type: 'textarea',
                value: '',
            },
        ],
    },
];
