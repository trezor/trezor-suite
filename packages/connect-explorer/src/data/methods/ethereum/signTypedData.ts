const name = 'ethereumSignTypedData';
const docs = 'methods/ethereumSignTypedData.md';

const eip712Data = {
    types: {
        EIP712Domain: [],
    },
    domain: {},
    message: {},
    primaryType: 'EIP712Domain',
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
                value: eip712Data,
            },
            {
                name: 'domain_separator_hash',
                type: 'input',
                value: '0x6192106f129ce05c9075d319c1fa6ea9b3ae37cbd0c1ef92e2be7137bb07baa1',
            },
        ],
    },
];
