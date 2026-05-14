const name = 'ethereumSignTransaction';

const tx = {
    nonce: '0x0',
    gasPrice: '0x14',
    gasLimit: '0x14',
    to: '0xd0d6d6c5fe4a677d343cc433536bb717bae167dd',
    chainId: 1,
    value: '1',
};

export default [
    {
        name,
        submitButton: 'Sign transaction',
        fields: [
            {
                name: 'path',
                type: 'input',
                value: `m/44'/60'/0'/0/0`,
            },
            {
                name: 'transaction',
                type: 'json',
                value: tx,
            },
            {
                name: 'chunkify',
                type: 'checkbox',
                value: false,
            },
        ],
    },
];
