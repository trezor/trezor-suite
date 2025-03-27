export default {
    method: 'getPublicKey',
    setup: {
        mnemonic: 'mnemonic_12',
    },
    tests: [
        {
            description: 'Bitcoin p2tr first account',
            params: {
                path: "m/86'/0'/0'",
                coin: 'bitcoin',
            },
            result: {
                xpub: 'xpub6D1saVFSZYgqXCXDfc5m2KdPXUsBXC12E3WntXXzWGJB8dEBr3CGR62emtC8sxJRVRSmBKbtJubuaaGEvZeeCEWaPaYvD9iJwp2Ky7sZws7',
                xpubSegwit: `tr([95d8f670/86'/0'/0']xpub6D1saVFSZYgqXCXDfc5m2KdPXUsBXC12E3WntXXzWGJB8dEBr3CGR62emtC8sxJRVRSmBKbtJubuaaGEvZeeCEWaPaYvD9iJwp2Ky7sZws7/<0;1>/*)`,
                descriptor: `tr([95d8f670/86h/0h/0h]xpub6D1saVFSZYgqXCXDfc5m2KdPXUsBXC12E3WntXXzWGJB8dEBr3CGR62emtC8sxJRVRSmBKbtJubuaaGEvZeeCEWaPaYvD9iJwp2Ky7sZws7/<0;1>/*)#htg5lhe3`,
            },
            legacyResults: [
                {
                    rules: ['<1.10.4', '<2.4.3'],
                    success: false,
                },
            ],
        },
        {
            description: 'Bitcoin bech32 first account',
            params: {
                path: "m/84'/0'/0'",
                coin: 'btc',
            },
            result: {
                xpub: 'xpub6Bmuozp73G1Ng4FtB1dzVJ9WGg6BcMn5xgUd7rQ8NybSHytQjkyfqMZfJ635zoHMYZoMuS4uCEz86SPLpvfFQxQe1acY5U7FzX9yL5DyRAe',
                xpubSegwit:
                    'zpub6qSSRL9wLd6LNee7qjDEuULWccP5Vbm5nuX4geBu8zMCQBWsF5Jo5UswLVxFzcbCMr2yQPG27ZhDs1cUGKVH1RmqkG1PFHkEXyHG7EV3ogY',
                descriptor:
                    'wpkh([95d8f670/84h/0h/0h]xpub6Bmuozp73G1Ng4FtB1dzVJ9WGg6BcMn5xgUd7rQ8NybSHytQjkyfqMZfJ635zoHMYZoMuS4uCEz86SPLpvfFQxQe1acY5U7FzX9yL5DyRAe/<0;1>/*)#78czyhf0',
            },
        },
        {
            description: 'Bitcoin p2sh first account',
            params: {
                path: "m/49'/0'/0'",
                coin: 'btc',
            },
            result: {
                xpub: 'xpub6DExuxjQ16sWy5TF4KkLV65YGqCJ5pyv7Ej7d9yJNAXz7C1M9intqszXfaNZG99KsDJdQ29wUKBTZHZFXUaPbKTZ5Z6f4yowNvAQ8fEJw2G',
                xpubSegwit:
                    'ypub6Y5EDdQK9nQzpNeMtgXxhBB3SoLk2SyR2MFLQYsBkAusAHpaQNxTTwefgnL9G3oFGrRS9VkVvyY1SaApFAzQPZ99wto5etdReeE3XFkkMZt',
                descriptor:
                    'sh(wpkh([95d8f670/49h/0h/0h]xpub6DExuxjQ16sWy5TF4KkLV65YGqCJ5pyv7Ej7d9yJNAXz7C1M9intqszXfaNZG99KsDJdQ29wUKBTZHZFXUaPbKTZ5Z6f4yowNvAQ8fEJw2G/<0;1>/*))#euxgwkh5',
            },
        },
        {
            description: 'Bitcoin p2sh first account (path as array)',
            params: {
                path: [2147483697, 2147483648, 2147483648],
                coin: 'Bitcoin',
            },
            result: {
                xpub: 'xpub6DExuxjQ16sWy5TF4KkLV65YGqCJ5pyv7Ej7d9yJNAXz7C1M9intqszXfaNZG99KsDJdQ29wUKBTZHZFXUaPbKTZ5Z6f4yowNvAQ8fEJw2G',
                xpubSegwit:
                    'ypub6Y5EDdQK9nQzpNeMtgXxhBB3SoLk2SyR2MFLQYsBkAusAHpaQNxTTwefgnL9G3oFGrRS9VkVvyY1SaApFAzQPZ99wto5etdReeE3XFkkMZt',
                descriptor:
                    'sh(wpkh([95d8f670/49h/0h/0h]xpub6DExuxjQ16sWy5TF4KkLV65YGqCJ5pyv7Ej7d9yJNAXz7C1M9intqszXfaNZG99KsDJdQ29wUKBTZHZFXUaPbKTZ5Z6f4yowNvAQ8fEJw2G/<0;1>/*))#euxgwkh5',
            },
        },
        {
            description: 'Bitcoin p2pkh first account',
            params: {
                path: "m/44'/0'/0'",
                coin: 'bitcoin',
            },
            result: {
                xpub: 'xpub6D1weXBcFAo8CqBbpP4TbH5sxQH8ZkqC5pDEvJ95rNNBZC9zrKmZP2fXMuve7ZRBe18pWQQsGg68jkq24mZchHwYENd8cCiSb71u3KD4AFH',
                descriptor:
                    'pkh([95d8f670/44h/0h/0h]xpub6D1weXBcFAo8CqBbpP4TbH5sxQH8ZkqC5pDEvJ95rNNBZC9zrKmZP2fXMuve7ZRBe18pWQQsGg68jkq24mZchHwYENd8cCiSb71u3KD4AFH/<0;1>/*)#k60fe5pm',
            },
        },
        {
            description: 'Invalid path',
            params: {
                path: [-1],
                coin: 'ltc',
            },
            result: false,
        },
        {
            description: 'Invalid path (too short)',
            params: {
                path: [0, 1],
                coin: 'Litecoin',
            },
            result: false,
        },
    ],
} satisfies TestCase;
