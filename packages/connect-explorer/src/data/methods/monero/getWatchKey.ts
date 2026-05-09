const name = 'moneroGetWatchKey';

const fields = [
    {
        name: 'path',
        type: 'input',
        value: `m/44'/128'/0'`,
    },
    {
        name: 'networkType',
        type: 'select',
        value: 0,
        data: [
            { value: 0, label: 'MAINNET' },
            { value: 1, label: 'TESTNET' },
            { value: 2, label: 'STAGENET' },
            { value: 3, label: 'FAKECHAIN' },
        ],
    },
];

export default [
    {
        name,
        submitButton: 'Get watch-only credentials',
        fields,
    },
];
