const legacyResults = [
    {
        rules: ['<2.5.3', '1'],
        success: false,
    },
];

const moneroGetWatchKey: TestCase = {
    method: 'moneroGetWatchKey',
    setup: {
        mnemonic: 'mnemonic_all',
    },
    tests: [
        {
            description: "m/44'/128'/0' - mainnet",
            params: {
                path: "m/44'/128'/0'",
            },
            result: {
                watch_key: '29dcf769c298c3cede13013baf255be012c7b6d5e889e493be7d8ba766d09d00',
                address:
                    '47epDGnbMoYMZh2HzbKPyjeAKvkxomBMACV9gSDWSTm5EeQZeSG6724j9rZMLaFjoC3HZtkPePDE6V4pvHRu9xAQMvqsh4K',
            },
            legacyResults,
        },
        {
            description: "m/44'/128'/1' - mainnet",
            params: {
                path: "m/44'/128'/1'",
            },
            result: {
                watch_key: '4493798eb2e733a58eaeb3e10991ed7b1f8c5f0307a7c3d1025b6ca44663a607',
                address:
                    '44en1H854HVB4Ae5nRZrNxcjYKqSy5hAEJB6UyuPHYaSFAir6vYxPaGEi3jHom2Amn4nE7RzTwYVCHh87krh5AFfHWHvxCT',
            },
            legacyResults,
        },
        {
            description: "m/44'/128'/0' - testnet",
            params: {
                path: "m/44'/128'/0'",
                networkType: 1, // TESTNET
            },
            result: {
                watch_key: '29dcf769c298c3cede13013baf255be012c7b6d5e889e493be7d8ba766d09d00',
                address:
                    '9yCMhXSreAeMZh2HzbKPyjeAKvkxomBMACV9gSDWSTm5EeQZeSG6724j9rZMLaFjoC3HZtkPePDE6V4pvHRu9xAQMvrvRRU',
            },
            legacyResults,
        },
        {
            description: "m/44'/128'/2' - mainnet",
            params: {
                path: "m/44'/128'/2'",
            },
            result: {
                watch_key: '521cd3ffbe26c434d8b4fff5b19b7d373244641fb14c45a9597bf387e7221f0e',
                address:
                    '49HJZu5MUCccqRxYETkvHLSrp3VvHXXtCahZReQtAoWfHYSfoQEmDKhBFCsCgh7Cq28LSQ5zVRmn7jFpVeZJPJBu9VmqNuT',
            },
            legacyResults,
        },
        {
            description: 'Invalid path - not all hardened',
            params: {
                path: "m/44'/128'/0",
            },
            result: false,
            legacyResults,
        },
        {
            description: 'Invalid path - too short',
            params: {
                path: "m/44'/128'",
            },
            result: false,
            legacyResults,
        },
        {
            description: 'Invalid path - array with non-hardened',
            params: {
                path: [0x80000000 + 44, 0x80000000 + 128, 0],
            },
            result: false,
            legacyResults,
        },
    ],
};

export default moneroGetWatchKey;
