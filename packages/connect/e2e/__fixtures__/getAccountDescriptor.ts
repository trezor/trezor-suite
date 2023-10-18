export default {
    method: 'getAccountDescriptor',
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
                descriptor:
                    'upub5Eo1frmiD2QQL6L5x5toFyJVZQuFijQTwiDK7S7KDkgCNykDJtG4TApkdv23L5MDLgRuxMJQEucxXVio2ciKCqfx6Y41skKTZhxNjSgJ6pU',
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
                descriptor:
                    '5d010cf16fdeff40955633d6c565f3844a288a24967cf6b76acbeb271b4f13c1f123474e140a2c360b01f0fa66f2f22e2e965a5b07a80358cf75f77abbd66088',
            },
        },
    ],
};
