const name = 'rippleSignTransaction';
const docs = 'methods/rippleSignTransaction.md';

const example = `{
    fee: '12',
    flags: 0x80000000,
    sequence: 25,
    payment: {
        amount: '1000000',
        destination: 'rBKz5MC2iXdoS3XgnNSYmF69K1Yo4NS3Ws',
    }
}`;

export default [
    {
        url: '/method/rippleSignTransaction',
        name,
        docs,
        submitButton: 'Sign transaction',
        fields: [
            {
                name: 'path',
                label: 'Bip44 path',
                type: 'input',
                value: `m/44'/144'/0'/0/0`,
            },
            {
                name: 'transaction',
                type: 'json',
                value: example,
            },
        ],
    },
];
