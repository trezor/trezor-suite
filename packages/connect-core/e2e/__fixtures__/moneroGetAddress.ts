const legacyResults = [
    {
        rules: ['<2.5.3', '1'],
        success: false,
    },
];

const moneroGetAddress: TestCase = {
    method: 'moneroGetAddress',
    setup: {
        mnemonic: 'mnemonic_all',
    },
    tests: [
        {
            description: "m/44'/128'/0' - account 0, minor 0",
            params: {
                path: "m/44'/128'/0'",
                account: 0,
                minor: 0,
                showOnTrezor: false,
            },
            result: {
                address:
                    '47epDGnbMoYMZh2HzbKPyjeAKvkxomBMACV9gSDWSTm5EeQZeSG6724j9rZMLaFjoC3HZtkPePDE6V4pvHRu9xAQMvqsh4K',
            },
            legacyResults,
        },
        {
            description: "m/44'/128'/0' - account 0, minor 1",
            params: {
                path: "m/44'/128'/0'",
                account: 0,
                minor: 1,
                showOnTrezor: false,
            },
            result: {
                address:
                    '8BRrovi9yRqX7M2NhEriEZMyDUjzbNJ3EJ72YZ3ssm1TX7tpg4rWeRiAhPvRATPKpdV417EkYAmT1CLUECVFWbU9NEyvVas',
            },
            legacyResults,
        },
        {
            description: "m/44'/128'/1' - account 0, minor 0",
            params: {
                path: "m/44'/128'/1'",
                account: 0,
                minor: 0,
                showOnTrezor: false,
            },
            result: {
                address:
                    '44en1H854HVB4Ae5nRZrNxcjYKqSy5hAEJB6UyuPHYaSFAir6vYxPaGEi3jHom2Amn4nE7RzTwYVCHh87krh5AFfHWHvxCT',
            },
            legacyResults,
        },
        {
            description: "m/44'/128'/0' - account 1, minor 0",
            params: {
                path: "m/44'/128'/0'",
                account: 1,
                minor: 0,
                showOnTrezor: false,
            },
            result: {
                address:
                    '89ammSq47WjMiXo7m75vKaTZEBDXcXMMiJY7kfjLYkQeR65kDYMbNtY9wafVHJoq87h5hLqSHwDwDUmC9fse2cKNBQDq8uC',
            },
            legacyResults,
        },
        {
            description: "m/44'/128'/2' - account 2, minor 5",
            params: {
                path: "m/44'/128'/2'",
                account: 2,
                minor: 5,
                showOnTrezor: false,
            },
            result: {
                address:
                    '83Fdt3T3bfJVt7MXF3nojkTDiD82dL2QaQrinBQqpgUDbaf2kU9XpVSgMQTpjhot8mf8NcNKaF8Bg2CHh8Q5LFpcB9bk6kn',
            },
            legacyResults,
        },
        {
            description: "m/44'/128'/0' with integrated address (payment_id)",
            params: {
                path: "m/44'/128'/0'",
                account: 0,
                minor: 0,
                paymentId: '0123456789abcdef',
                showOnTrezor: false,
            },
            result: {
                address:
                    '4HMVE5c5y54MZh2HzbKPyjeAKvkxomBMACV9gSDWSTm5EeQZeSG6724j9rZMLaFjoC3HZtkPePDE6V4pvHRu9xAQXwmwcvCxs3iTzaHTmp',
            },
            legacyResults,
        },
        {
            description: "m/44'/128'/0' - testnet",
            params: {
                path: "m/44'/128'/0'",
                account: 0,
                minor: 0,
                networkType: 1, // TESTNET
                showOnTrezor: false,
            },
            result: {
                address:
                    '9yCMhXSreAeMZh2HzbKPyjeAKvkxomBMACV9gSDWSTm5EeQZeSG6724j9rZMLaFjoC3HZtkPePDE6V4pvHRu9xAQMvrvRRU',
            },
            legacyResults,
        },
        {
            description: "m/44'/128'/0' - stagenet",
            params: {
                path: "m/44'/128'/0'",
                account: 0,
                minor: 0,
                networkType: 2, // STAGENET
                showOnTrezor: false,
            },
            result: {
                address:
                    '57rrJ7hZ1QeMZh2HzbKPyjeAKvkxomBMACV9gSDWSTm5EeQZeSG6724j9rZMLaFjoC3HZtkPePDE6V4pvHRu9xAQMww2cKD',
            },
            legacyResults,
        },
        {
            description: 'Invalid path - not all hardened',
            params: {
                path: "m/44'/128'/0",
                account: 0,
                minor: 0,
                showOnTrezor: false,
            },
            result: false,
            legacyResults,
        },
        {
            description: 'Invalid path - too short',
            params: {
                path: "m/44'/128'",
                account: 0,
                minor: 0,
                showOnTrezor: false,
            },
            result: false,
            legacyResults,
        },
        {
            description: 'Invalid path - array with non-hardened component',
            params: {
                path: [0x80000000 + 44, 0x80000000 + 128, 0],
                account: 0,
                minor: 0,
                showOnTrezor: false,
            },
            result: false,
            legacyResults,
        },
        {
            description: 'Bundle - multiple addresses',
            params: {
                bundle: [
                    {
                        path: "m/44'/128'/0'",
                        account: 0,
                        minor: 0,
                        showOnTrezor: false,
                    },
                    {
                        path: "m/44'/128'/0'",
                        account: 0,
                        minor: 1,
                        showOnTrezor: false,
                    },
                    {
                        path: "m/44'/128'/1'",
                        account: 0,
                        minor: 0,
                        showOnTrezor: false,
                    },
                ],
            },
            result: [
                {
                    address:
                        '47epDGnbMoYMZh2HzbKPyjeAKvkxomBMACV9gSDWSTm5EeQZeSG6724j9rZMLaFjoC3HZtkPePDE6V4pvHRu9xAQMvqsh4K',
                },
                {
                    address:
                        '8BRrovi9yRqX7M2NhEriEZMyDUjzbNJ3EJ72YZ3ssm1TX7tpg4rWeRiAhPvRATPKpdV417EkYAmT1CLUECVFWbU9NEyvVas',
                },
                {
                    address:
                        '44en1H854HVB4Ae5nRZrNxcjYKqSy5hAEJB6UyuPHYaSFAir6vYxPaGEi3jHom2Amn4nE7RzTwYVCHh87krh5AFfHWHvxCT',
                },
            ],
            legacyResults,
        },
    ],
};

export default moneroGetAddress;
