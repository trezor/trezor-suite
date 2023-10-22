const name = 'ethereumSignTransaction';
const docs = 'methods/ethereumSignTransaction.md';

const tx = {
    nonce: '0x0',
    gasPrice: '0x14',
    gasLimit: '0x14',
    to: '0x26fb86579e371c7AEdc461b2DdEF0A8628c93d3B',
    chainId: 1,
    value: '0x0',
    data: '0xa9059cbb000000000000000000000000D6971aabeDC7f2A8113679199FE374aE1B1Aea96000000000000000000000000000000000000000000000000000000000097f6b2',
};

// sending erc-20 unknown token (unknown to firmware)
// https://etherscan.io/token/0x26fb86579e371c7aedc461b2ddef0a8628c93d3b
export default [
    {
        url: '/method/ethereumSignTransaction-erc20-unknown',
        name,
        docs,
        submitButton: 'Sign transaction',
        fields: [
            {
                name: 'path',
                label: 'Bip44 path',
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
                label: 'Display recipient address in chunks of 4 characters',
                type: 'checkbox',
                value: false,
            },
        ],
    },
];
