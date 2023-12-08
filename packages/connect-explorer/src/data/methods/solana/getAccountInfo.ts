const name = 'getAccountInfo';
const docs = 'methods/getAccountInfo.md';

export default [
    {
        url: '/method/getAccountInfo-discovery-solana',
        name,
        docs,
        submitButton: 'Get account info',
        fields: [
            {
                name: 'coin',
                type: 'select',
                value: 'dsol',
                affect: 'path',
                data: [
                    { value: 'sol', label: 'Solana', affectedValue: `m/44'/501'/0'/0'` },
                    { value: 'dsol', label: 'Solana Devnet', affectedValue: `m/44'/501'/0'/0'` },
                ],
            },
        ],
    },
];
