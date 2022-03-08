const name = 'ethereumSignTypedData';
const docs = 'methods/ethereumSignTypedData.md';

const eip712Data = {
    types: {
        EIP712Domain: [
            {
                name: 'name',
                type: 'string',
            },
        ],
        Message: [
            {
                name: 'Best Wallet',
                type: 'string',
            },
            {
                name: 'Number',
                type: 'uint64',
            },
        ],
    },
    domain: {
        name: 'example.trezor.io',
    },
    message: {
        'Best Wallet': 'Trezor Model T',
        Number: 123,
    },
    primaryType: 'Message',
};

export default [
    {
        url: '/method/ethereumSignTypedData',
        name,
        docs,
        submitButton: 'Submit',
        fields: [
            {
                name: 'path',
                label: 'Bip44 path',
                type: 'input',
                value: `m/44'/60'/0'/0/0`,
            },
            {
                name: 'metamask_v4_compat',
                type: 'checkbox',
                value: true,
            },
            {
                name: 'data',
                type: 'json',
                value: JSON.stringify(eip712Data),
            },
        ],
    },
];
