const name = 'nemSignTransaction';
const docs = 'methods/nemSignTransaction.md';

const example = `{
    timeStamp: 74649215,
    amount: 2000000,
    fee: 2000000,
    recipient: "TALICE2GMA34CXHD7XLJQ536NM5UNKQHTORNNT2J",
    type: 257,
    deadline: 74735615,
    version: (0x98 << 24) >> 0,
    message: {
        payload: "746573745f6e656d5f7472616e73616374696f6e5f7472616e73666572",
        type: 1,
    },
}`;

export default [
    {
        url: '/method/nemSignTransaction',
        name,
        docs,
        submitButton: 'Sign transaction',
        fields: [
            {
                name: 'path',
                label: 'Bip44 path',
                type: 'input',
                value: `m/44'/43'/0'/0/0`,
            },
            {
                name: 'transaction',
                type: 'json',
                value: example,
            },
        ],
    },
];
