export default {
    method: 'getAccountInfo',
    setup: {
        mnemonic: 'mnemonic_12',
    },
    tests: [
        {
            description: 'Bitcoin (P2SH): first account using path',
            params: {
                coin: 'Bitcoin',
                path: "m/49'/0'/0'",
            },
            result: {
                descriptor:
                    'ypub6Y5EDdQK9nQzpNeMtgXxhBB3SoLk2SyR2MFLQYsBkAusAHpaQNxTTwefgnL9G3oFGrRS9VkVvyY1SaApFAzQPZ99wto5etdReeE3XFkkMZt',
            },
        },
        {
            description: 'Bitcoin (P2PKH): first account using path',
            params: {
                coin: 'Bitcoin',
                path: "m/44'/0'/0'",
            },
            result: {
                descriptor:
                    'xpub6D1weXBcFAo8CqBbpP4TbH5sxQH8ZkqC5pDEvJ95rNNBZC9zrKmZP2fXMuve7ZRBe18pWQQsGg68jkq24mZchHwYENd8cCiSb71u3KD4AFH',
            },
        },
        {
            description: 'Testnet (P2SH): empty account using path',
            params: {
                coin: 'Testnet',
                path: "m/49'/1'/256'",
            },
            result: {
                balance: '0',
                availableBalance: '0',
                empty: true,
                descriptor:
                    'upub5Eo1frmiD2QQL6L5x5toFyJVZQuFijQTwiDK7S7KDkgCNykDJtG4TApkdv23L5MDLgRuxMJQEucxXVio2ciKCqfx6Y41skKTZhxNjSgJ6pU',
            },
        },
        {
            description: 'Bitcoin (P2SH): account from descriptor',
            params: {
                coin: 'Bitcoin',
                descriptor:
                    'ypub6Y5EDdQK9nQzpNeMtgXxhBB3SoLk2SyR2MFLQYsBkAusAHpaQNxTTwefgnL9G3oFGrRS9VkVvyY1SaApFAzQPZ99wto5etdReeE3XFkkMZt',
            },
            result: {
                empty: false,
                descriptor:
                    'ypub6Y5EDdQK9nQzpNeMtgXxhBB3SoLk2SyR2MFLQYsBkAusAHpaQNxTTwefgnL9G3oFGrRS9VkVvyY1SaApFAzQPZ99wto5etdReeE3XFkkMZt',
            },
        },
        {
            description: 'Bitcoin (P2PKH): account from descriptor',
            params: {
                coin: 'Bitcoin',
                descriptor:
                    'xpub6DExuxjQ16sWy5TF4KkLV65YGqCJ5pyv7Ej7d9yJNAXz7C1M9intqszXfaNZG99KsDJdQ29wUKBTZHZFXUaPbKTZ5Z6f4yowNvAQ8fEJw2G',
            },
            result: {
                descriptor:
                    'xpub6DExuxjQ16sWy5TF4KkLV65YGqCJ5pyv7Ej7d9yJNAXz7C1M9intqszXfaNZG99KsDJdQ29wUKBTZHZFXUaPbKTZ5Z6f4yowNvAQ8fEJw2G',
            },
        },
        {
            description: 'Ethereum: first account',
            params: {
                coin: 'eth',
                path: "m/44'/60'/0'/0/0",
            },
            result: {
                descriptor: '0x3f2329C9ADFbcCd9A84f52c906E936A42dA18CB8',
                empty: false,
            },
        },
        {
            description: 'Ethereum: account from descriptor',
            params: {
                coin: 'eth',
                descriptor: '0x3f2329C9ADFbcCd9A84f52c906E936A42dA18CB8',
            },
            result: {
                descriptor: '0x3f2329C9ADFbcCd9A84f52c906E936A42dA18CB8',
                empty: false,
            },
        },
        {
            skip: ['1', '<2.1.0'],
            description: 'Ripple: first account',
            params: {
                coin: 'xrp',
                path: "m/44'/144'/0'/0/0",
            },
            result: {
                descriptor: 'rh5ZnEVySAy7oGd3nebT3wrohGDrsNS83E',
                empty: true,
            },
        },
        {
            skip: ['1', '<2.1.0'],
            description: 'Ripple: account from descriptor',
            params: {
                coin: 'xrp',
                descriptor: 'rfkV3EoXimH6JrG1QAyofgbVhnyZZDjWSj',
            },
            result: {
                descriptor: 'rfkV3EoXimH6JrG1QAyofgbVhnyZZDjWSj',
                empty: false,
            },
        },
        {
            description: 'invalid path',
            params: {
                coin: 'Bitcoin',
                path: "m/49'/0'",
            },
            result: false,
        },
        {
            skip: ['1', '<2.3.2'],
            setup: {
                mnemonic: 'mnemonic_all',
            },
            description: 'Cardano: empty account using descriptor',
            params: {
                coin: 'ada',
                descriptor:
                    '5d010cf16fdeff40955633d6c565f3844a288a24967cf6b76acbeb271b4f13c1f123474e140a2c360b01f0fa66f2f22e2e965a5b07a80358cf75f77abbd66088',
                useCardanoDerivation: true,
            },
            result: {
                availableBalance: '0',
                balance: '0',
                descriptor:
                    '5d010cf16fdeff40955633d6c565f3844a288a24967cf6b76acbeb271b4f13c1f123474e140a2c360b01f0fa66f2f22e2e965a5b07a80358cf75f77abbd66088',
                empty: true,
            },
        },
        {
            skip: ['1', '<2.3.2'],
            setup: {
                mnemonic: 'mnemonic_all',
            },
            description: 'Cardano: empty account using path',
            params: {
                coin: 'ada',
                path: "m/1852'/1815'/0'/0/0",
                useCardanoDerivation: true,
            },
            result: {
                availableBalance: '0',
                balance: '0',
                descriptor:
                    '5d010cf16fdeff40955633d6c565f3844a288a24967cf6b76acbeb271b4f13c1f123474e140a2c360b01f0fa66f2f22e2e965a5b07a80358cf75f77abbd66088',
                empty: true,
            },
        },
    ],
};
