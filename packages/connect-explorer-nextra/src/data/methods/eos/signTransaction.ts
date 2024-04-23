const name = 'eosSignTransaction';
const docs = 'methods/eosSignTransaction.md';

const tx = {
    inputs: [
        {
            path: "m/44'/1815'/0'/0/0",
            prev_hash: '2effff328b76a8113e32a218f7af99e77768289c9201e8d26a9cda0edaf59bfd',
            prev_index: 0,
            type: 0,
        },
    ],
    outputs: [
        {
            address:
                '2w1sdSJu3GVeNrv8NVHmWNBqK6ssW84An4pExajjdFgXx6k4gksoo6CP1qTwbE34qjKEHZtUKGxY1GMkApUnNEMwGPTgLc7Yghs',
            amount: '1000000',
        },
        {
            path: "m/44'/1815'/0'/0/1",
            amount: '7120787',
        },
    ],
    transactions: {
        chainId: 'cf057bbfb72640471fd910bcb67639c22df9f92470936cddc1ade0e2f2e7dc4f',
        header: {
            expiration: '2018-07-14T10:43:28',
            refBlockNum: 6439,
            refBlockPrefix: 2995713264,
            maxNetUsageWords: 0,
            maxCpuUsageMs: 0,
            delaySec: 0,
        },
        actions: [
            {
                account: 'foocontract',
                name: 'baraction',
                authorization: [{ actor: 'miniminimini', permission: 'active' }],
                data: 'deadbeef',
            },
        ],
    },
};

export default [
    {
        url: '/method/eosSignTransaction',
        name,
        docs,
        submitButton: 'Sign transaction',
        fields: [
            {
                name: 'path',
                label: 'Bip44 path',
                type: 'input',
                value: `m/44'/194'/0'/0/0`,
            },
            {
                name: 'transaction',
                type: 'json',
                value: tx.transactions,
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
