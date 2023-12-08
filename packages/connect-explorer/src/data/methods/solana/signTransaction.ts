const name = 'solanaSignTransaction';
const docs = 'methods/solanaSignTransaction.md';

const serializedTx =
    '0100040700d1699dcb1811b50bb0055f13044463128242e37a463b52f6c97a1f6eef88ad9bdc8c11af6a471f7373e52c917aac6304c71796b97b47350d46cf4c54bae9d9fdd530a73d5e74613b17aaeb9346f9fc3c5fd6a7ad126b269e3e73454e2a0b1b000000000000000000000000000000000000000000000000000000000000000081432588d91c8e02d613baa94e05994e78467cf5a8821d8f4c2e373e8b9b56ef8c97258f4e2489f1bb3d1029148e0d830b5a1399daff1084048e7bd8dbe9f85906ddf6e1d765a193d9cbe146ceeb79ac1cb485ed5f5b37913a8cf5857eff00a91aea57c9906a7cad656ff61b3893abda63f4b6b210c939855e7ab6e54049213d020506000201040306000604010402000a0c0b0000000000000009';

const additionalInfo = {
    tokenAccountsInfos: [
        {
            baseAddress: 'BVRFH6vt5bNXub6WnnFRgaHFTcbkjBrf7x1troU1izGg',
            tokenProgram: 'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA',
            tokenMint: '9hayiPmEobVfiTbw5R91StWeQzw9EJGfswLH5o33UDAW',
            tokenAccount: 'J5rhFGUkeoHVnCvMyqWq1XPjfU1G1hsTh9tTQtST2out',
        },
    ],
};

export default [
    {
        url: '/method/solanaSignTransaction',
        name,
        docs,
        submitButton: 'Sign transaction',
        fields: [
            {
                name: 'path',
                label: 'Bip44 path',
                type: 'input',
                value: `m/44'/501'/0'/0'`,
            },
            {
                name: 'serializedTx',
                label: 'Serialized transaction',
                type: 'input-long',
                value: serializedTx,
            },
            {
                name: 'additionalInfo',
                type: 'json',
                value: additionalInfo,
            },
        ],
    },
];
