export default {
    method: 'getAddress',
    setup: {
        mnemonic: 'mnemonic_12',
    },
    tests: [
        {
            description: "m/49'/0'/0'/0/0",
            params: {
                coin: 'Bitcoin',
                path: "m/49'/0'/0'/0/0",
                showOnTrezor: true,
            },
            result: {
                address: '3AnYTd2FGxJLNKL1AzxfW3FJMntp9D2KKX',
            },
        },
        {
            description: "m/49'/0'/0'/0/1",
            params: {
                coin: 'Bitcoin',
                path: "m/49'/0'/0'/0/1",
                showOnTrezor: true,
            },
            result: {
                address: '3CBs2AG2se3c3DxASUfgZE3PPwpMW1JhYp',
            },
        },
        {
            description: "m/49'/0'/0'/1/0",
            params: {
                coin: 'Bitcoin',
                path: "m/49'/0'/0'/1/0",
                showOnTrezor: true,
            },
            result: {
                address: '3DDuECA7AomS7GSf5G2NAF6djKEqF2qma5',
            },
        },
        {
            description: "m/49'/0'/0'/1/1",
            params: {
                coin: 'Bitcoin',
                path: "m/49'/0'/0'/1/1",
                showOnTrezor: true,
            },
            result: {
                address: '33Levhyt79XBK68BwyK61y5F1tE2ia7nZR',
            },
        },
    ],
};
