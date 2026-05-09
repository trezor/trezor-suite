const name = 'tezosSignTransaction';
const example = {
    transaction: {
        source: 'tz1ckrgqGGGBt4jGDmwFhtXc1LNpZJUnA9F2',
        destination: 'tz1cTfmc5uuBr2DmHDgkXTAoEcufvXLwq5TP',
        counter: 20449,
        amount: 1000000000,
        fee: 10000,
        gas_limit: 11000,
        storage_limit: 277,
    },
};

export default [
    {
        name,
        submitButton: 'Sign transaction',
        fields: [
            {
                name: 'path',
                type: 'input',
                value: `m/44'/1729'/0'`,
            },
            {
                name: 'branch',
                type: 'input-long',
                value: 'BKk7ZsvvkQSntQ31j2Hxsw8bfYtUKGjsKHT2aQrxAqUYyQUHxmM',
            },
            {
                name: 'operation',
                type: 'json',
                value: example,
            },
            {
                name: 'chunkify',
                type: 'checkbox',
                value: false,
            },
        ],
    },
];
