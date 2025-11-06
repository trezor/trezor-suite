const name = 'moneroGetWatchKey';
const docs = 'methods/moneroGetWatchKey.md';

const fields = [
    {
        name: 'path',
        label: 'Bip44 path',
        type: 'input',
        value: `m/44'/128'/0'`,
    },
    {
        name: 'networkType',
        label: 'Network Type',
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
        url: '/method/moneroGetWatchKey',
        name,
        docs,
        submitButton: 'Get watch-only credentials',
        fields,
    },
];
