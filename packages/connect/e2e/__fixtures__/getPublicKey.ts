// p2tr showOnTrezor: FW renders the descriptor in `h`-notation, while
// `displayablePublicKey` mirrors `xpubSegwit` in `'`-notation. They differ in
// path-notation, so deviceScreen and displayablePublicKey are declared
// separately to make the divergence visible.
const p2trDisplayablePublicKey = `tr([95d8f670/86'/0'/0']xpub6D1saVFSZYgqXCXDfc5m2KdPXUsBXC12E3WntXXzWGJB8dEBr3CGR62emtC8sxJRVRSmBKbtJubuaaGEvZeeCEWaPaYvD9iJwp2Ky7sZws7/<0;1>/*)`;
const p2trDeviceScreen = /tr\(\[95d8f670\/86h\/0h\/0h\]xpub6D1saVFSZYg/;

// bech32 / p2pkh showOnTrezor: FW renders the same string returned in
// `displayablePublicKey`. deviceScreen is a stable prefix.
const bech32DisplayablePublicKey =
    'zpub6qSSRL9wLd6LNee7qjDEuULWccP5Vbm5nuX4geBu8zMCQBWsF5Jo5UswLVxFzcbCMr2yQPG27ZhDs1cUGKVH1RmqkG1PFHkEXyHG7EV3ogY';
const bech32DeviceScreen = bech32DisplayablePublicKey.slice(0, 37);

const p2pkhDisplayablePublicKey =
    'xpub6D1weXBcFAo8CqBbpP4TbH5sxQH8ZkqC5pDEvJ95rNNBZC9zrKmZP2fXMuve7ZRBe18pWQQsGg68jkq24mZchHwYENd8cCiSb71u3KD4AFH';
const p2pkhDeviceScreen = p2pkhDisplayablePublicKey.slice(0, 37);

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
                coin: 'btc',
            },
            result: {
                xpub: 'xpub6D1saVFSZYgqXCXDfc5m2KdPXUsBXC12E3WntXXzWGJB8dEBr3CGR62emtC8sxJRVRSmBKbtJubuaaGEvZeeCEWaPaYvD9iJwp2Ky7sZws7',
                xpubSegwit: `tr([95d8f670/86'/0'/0']xpub6D1saVFSZYgqXCXDfc5m2KdPXUsBXC12E3WntXXzWGJB8dEBr3CGR62emtC8sxJRVRSmBKbtJubuaaGEvZeeCEWaPaYvD9iJwp2Ky7sZws7/<0;1>/*)`,
                descriptor: `tr([95d8f670/86h/0h/0h]xpub6D1saVFSZYgqXCXDfc5m2KdPXUsBXC12E3WntXXzWGJB8dEBr3CGR62emtC8sxJRVRSmBKbtJubuaaGEvZeeCEWaPaYvD9iJwp2Ky7sZws7/<0;1>/*)#htg5lhe3`,
                displayablePublicKey: `tr([95d8f670/86'/0'/0']xpub6D1saVFSZYgqXCXDfc5m2KdPXUsBXC12E3WntXXzWGJB8dEBr3CGR62emtC8sxJRVRSmBKbtJubuaaGEvZeeCEWaPaYvD9iJwp2Ky7sZws7/<0;1>/*)`,
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
                displayablePublicKey:
                    'zpub6qSSRL9wLd6LNee7qjDEuULWccP5Vbm5nuX4geBu8zMCQBWsF5Jo5UswLVxFzcbCMr2yQPG27ZhDs1cUGKVH1RmqkG1PFHkEXyHG7EV3ogY',
            },
            get legacyResults() {
                const { descriptor, ...payload } = this.result;

                return [{ rules: ['<2.7.0'], payload }];
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
                displayablePublicKey:
                    'ypub6Y5EDdQK9nQzpNeMtgXxhBB3SoLk2SyR2MFLQYsBkAusAHpaQNxTTwefgnL9G3oFGrRS9VkVvyY1SaApFAzQPZ99wto5etdReeE3XFkkMZt',
            },
            get legacyResults() {
                const { descriptor, ...payload } = this.result;

                return [{ rules: ['<2.7.0'], payload }];
            },
        },
        {
            description: 'Bitcoin p2sh first account (path as array)',
            params: {
                path: [2147483697, 2147483648, 2147483648],
                coin: 'btc',
            },
            result: {
                xpub: 'xpub6DExuxjQ16sWy5TF4KkLV65YGqCJ5pyv7Ej7d9yJNAXz7C1M9intqszXfaNZG99KsDJdQ29wUKBTZHZFXUaPbKTZ5Z6f4yowNvAQ8fEJw2G',
                xpubSegwit:
                    'ypub6Y5EDdQK9nQzpNeMtgXxhBB3SoLk2SyR2MFLQYsBkAusAHpaQNxTTwefgnL9G3oFGrRS9VkVvyY1SaApFAzQPZ99wto5etdReeE3XFkkMZt',
                descriptor:
                    'sh(wpkh([95d8f670/49h/0h/0h]xpub6DExuxjQ16sWy5TF4KkLV65YGqCJ5pyv7Ej7d9yJNAXz7C1M9intqszXfaNZG99KsDJdQ29wUKBTZHZFXUaPbKTZ5Z6f4yowNvAQ8fEJw2G/<0;1>/*))#euxgwkh5',
                displayablePublicKey:
                    'ypub6Y5EDdQK9nQzpNeMtgXxhBB3SoLk2SyR2MFLQYsBkAusAHpaQNxTTwefgnL9G3oFGrRS9VkVvyY1SaApFAzQPZ99wto5etdReeE3XFkkMZt',
            },
            get legacyResults() {
                const { descriptor, ...payload } = this.result;

                return [{ rules: ['<2.7.0'], payload }];
            },
        },
        {
            description: 'Bitcoin p2pkh first account',
            params: {
                path: "m/44'/0'/0'",
                coin: 'btc',
            },
            result: {
                xpub: 'xpub6D1weXBcFAo8CqBbpP4TbH5sxQH8ZkqC5pDEvJ95rNNBZC9zrKmZP2fXMuve7ZRBe18pWQQsGg68jkq24mZchHwYENd8cCiSb71u3KD4AFH',
                descriptor:
                    'pkh([95d8f670/44h/0h/0h]xpub6D1weXBcFAo8CqBbpP4TbH5sxQH8ZkqC5pDEvJ95rNNBZC9zrKmZP2fXMuve7ZRBe18pWQQsGg68jkq24mZchHwYENd8cCiSb71u3KD4AFH/<0;1>/*)#k60fe5pm',
                displayablePublicKey:
                    'xpub6D1weXBcFAo8CqBbpP4TbH5sxQH8ZkqC5pDEvJ95rNNBZC9zrKmZP2fXMuve7ZRBe18pWQQsGg68jkq24mZchHwYENd8cCiSb71u3KD4AFH',
            },
            get legacyResults() {
                const { descriptor, ...payload } = this.result;

                return [{ rules: ['<2.7.0'], payload }];
            },
        },
        {
            description: 'Bitcoin p2tr first account (showOnTrezor)',
            params: {
                path: "m/86'/0'/0'",
                coin: 'btc',
                showOnTrezor: true,
            },
            result: {
                xpub: 'xpub6D1saVFSZYgqXCXDfc5m2KdPXUsBXC12E3WntXXzWGJB8dEBr3CGR62emtC8sxJRVRSmBKbtJubuaaGEvZeeCEWaPaYvD9iJwp2Ky7sZws7',
                xpubSegwit: p2trDisplayablePublicKey,
                descriptor: `tr([95d8f670/86h/0h/0h]xpub6D1saVFSZYgqXCXDfc5m2KdPXUsBXC12E3WntXXzWGJB8dEBr3CGR62emtC8sxJRVRSmBKbtJubuaaGEvZeeCEWaPaYvD9iJwp2Ky7sZws7/<0;1>/*)#htg5lhe3`,
                displayablePublicKey: p2trDisplayablePublicKey,
            },
            deviceScreen: p2trDeviceScreen,
            // T1B1 emulator's getScreenContent returns a placeholder; older T2T1 FW
            // doesn't render descriptors.
            deviceScreenSkip: ['1', '<2.7.0'],
            legacyResults: [
                {
                    rules: ['<1.10.4', '<2.4.3'],
                    success: false,
                },
            ],
        },
        {
            description: 'Bitcoin bech32 first account (showOnTrezor)',
            params: {
                path: "m/84'/0'/0'",
                coin: 'btc',
                showOnTrezor: true,
            },
            result: {
                xpub: 'xpub6Bmuozp73G1Ng4FtB1dzVJ9WGg6BcMn5xgUd7rQ8NybSHytQjkyfqMZfJ635zoHMYZoMuS4uCEz86SPLpvfFQxQe1acY5U7FzX9yL5DyRAe',
                xpubSegwit: bech32DisplayablePublicKey,
                descriptor:
                    'wpkh([95d8f670/84h/0h/0h]xpub6Bmuozp73G1Ng4FtB1dzVJ9WGg6BcMn5xgUd7rQ8NybSHytQjkyfqMZfJ635zoHMYZoMuS4uCEz86SPLpvfFQxQe1acY5U7FzX9yL5DyRAe/<0;1>/*)#78czyhf0',
                displayablePublicKey: bech32DisplayablePublicKey,
            },
            deviceScreen: bech32DeviceScreen,
            deviceScreenSkip: ['1', '<2.7.0'],
            get legacyResults() {
                const { descriptor, ...payload } = this.result;

                return [{ rules: ['<2.7.0'], payload }];
            },
        },
        {
            description: 'Bitcoin p2pkh first account (showOnTrezor)',
            params: {
                path: "m/44'/0'/0'",
                coin: 'btc',
                showOnTrezor: true,
            },
            result: {
                xpub: p2pkhDisplayablePublicKey,
                descriptor:
                    'pkh([95d8f670/44h/0h/0h]xpub6D1weXBcFAo8CqBbpP4TbH5sxQH8ZkqC5pDEvJ95rNNBZC9zrKmZP2fXMuve7ZRBe18pWQQsGg68jkq24mZchHwYENd8cCiSb71u3KD4AFH/<0;1>/*)#k60fe5pm',
                displayablePublicKey: p2pkhDisplayablePublicKey,
            },
            deviceScreen: p2pkhDeviceScreen,
            deviceScreenSkip: ['1', '<2.7.0'],
            get legacyResults() {
                const { descriptor, ...payload } = this.result;

                return [{ rules: ['<2.7.0'], payload }];
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
                coin: 'ltc',
            },
            result: false,
        },
    ],
} satisfies TestCase;
