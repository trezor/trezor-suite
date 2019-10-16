/* @flow */

const name = 'liskSignTransaction';
const docs = 'methods/liskSignTransaction.md';
const example = `{
    amount: "10000000",
    recipientId: "9971262264659915921L",
    timestamp: 57525937,
    type: 0,
    fee: "20000000",
    asset: {
        data: "Test data"
    }
}`;

export default [
    {
        url: '/method/liskSignTransaction',
        name,
        docs,
        submitButton: 'Sign transaction',
        fields: [
            {
                name: 'path',
                label: 'Bip44 path',
                type: 'input',
                value: `m/44'/134'/0'`,
            },
            {
                name: 'transaction',
                type: 'json',
                value: example
            },
        ]
    },
]