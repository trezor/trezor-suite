const name = 'getAccountInfo';
const docs = 'methods/getAccountInfo.md';

export default [
    {
        url: '/method/getAccountInfo-discovery-cardano',
        name,
        docs,
        submitButton: 'Get account info',

        fields: [
            {
                name: 'coin',
                type: 'select',
                value: 'test',
                data: [
                    { value: 'ada', label: 'Cardano' },
                    { value: 'tada', label: 'Cardano Testnet' },
                ],
            },
        ],
    },
];
