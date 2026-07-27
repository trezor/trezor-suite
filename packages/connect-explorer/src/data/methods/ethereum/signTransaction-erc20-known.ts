const name = 'ethereumSignTransaction';
const tx = {
    nonce: '0x0',
    gasPrice: '0x14',
    gasLimit: '0x14',
    to: '0xdAC17F958D2ee523a2206206994597C13D831ec7',
    chainId: 1,
    value: '0x0',
    data: '0xa9059cbb000000000000000000000000D6971aabeDC7f2A8113679199FE374aE1B1Aea96000000000000000000000000000000000000000000000000000000000097f6b2',
};

// sending erc20 known token (USDT)
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
