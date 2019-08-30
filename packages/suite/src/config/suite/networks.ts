export default [
    // Bitcoin
    {
        name: 'Bitcoin',
        networkType: 'bitcoin',
        accountType: 'normal',
        symbol: 'btc',
        bip44: "m/84'/0'/i'",
        hasSignVerify: true,
        explorer: {
            tx: 'https://example.com',
            address: 'https://example.com/address/',
        },
    },
    {
        name: 'Bitcoin (segwit)',
        networkType: 'bitcoin',
        accountType: 'segwit',
        symbol: 'btc',
        bip44: "m/49'/0'/i'",
        hasSignVerify: true,
        explorer: {
            tx: 'https://example.com',
            address: 'https://example.com/address/',
        },
    },
    {
        name: 'Bitcoin (legacy)',
        networkType: 'bitcoin',
        accountType: 'legacy',
        symbol: 'btc',
        bip44: "m/44'/0'/i'",
        hasSignVerify: true,
        explorer: {
            tx: 'https://example.com',
            address: 'https://example.com/address/',
        },
    },
    // Litecoin
    {
        name: 'Litecoin',
        networkType: 'litecoin',
        accountType: 'normal',
        symbol: 'ltc',
        bip44: "m/49'/2'/i'",
        hasSignVerify: true,
        explorer: {
            tx: 'https://example.com',
            address: 'https://example.com/address/',
        },
    },
    {
        name: 'Litecoin (legacy)',
        networkType: 'litecoin',
        accountType: 'legacy',
        symbol: 'ltc',
        bip44: "m/44'/2'/i'",
        hasSignVerify: true,
        explorer: {
            tx: 'https://example.com',
            address: 'https://example.com/address/',
        },
    },
    // Bitcoin testnet
    {
        name: 'Bitcoin Test',
        networkType: 'bitcoin',
        accountType: 'normal',
        symbol: 'test',
        bip44: "m/84'/1'/i'",
        hasSignVerify: true,
        explorer: {
            tx: 'https://example.com',
            address: 'https://example.com/address/',
        },
    },
    {
        name: 'Bitcoin Test (segwit)',
        networkType: 'bitcoin',
        accountType: 'segwit',
        symbol: 'test',
        bip44: "m/49'/1'/i'",
        hasSignVerify: true,
        explorer: {
            tx: 'https://example.com',
            address: 'https://example.com/address/',
        },
    },
    {
        name: 'Bitcoin Test (legacy)',
        networkType: 'bitcoin',
        accountType: 'legacy',
        symbol: 'test',
        bip44: "m/44'/1'/i'",
        hasSignVerify: true,
        explorer: {
            tx: 'https://example.com',
            address: 'https://example.com/address/',
        },
    },
    // Ethereum
    {
        name: 'Ethereum',
        networkType: 'ethereum',
        accountType: 'normal',
        symbol: 'eth',
        bip44: "m/44'/60'/0'/0/i",
        hasSignVerify: false,
        explorer: {
            tx: 'https://example.com',
            address: 'https://example.com/address/',
        },
    },
    {
        name: 'Ethereum Classic',
        networkType: 'ethereum',
        accountType: 'normal',
        symbol: 'etc',
        bip44: "m/44'/61'/0'/0/i",
        hasSignVerify: true,
        explorer: {
            tx: 'https://example.com',
            address: 'https://example.com/address/',
        },
    },
    {
        name: 'Ethereum Ropsten',
        networkType: 'ethereum',
        accountType: 'normal',
        symbol: 'trop',
        bip44: "m/44'/60'/0'/0/i",
        hasSignVerify: true,
        explorer: {
            tx: 'https://example.com',
            address: 'https://example.com/address/',
        },
    },
    // Ripple
    {
        name: 'XRP',
        networkType: 'ripple',
        accountType: 'normal',
        symbol: 'xrp',
        bip44: "m/44'/144'/i'/0/0",
        hasSignVerify: false,
        explorer: {
            tx: 'https://example.com',
            address: 'https://example.com/address/',
        },
    },
    {
        name: 'XRP Testnet',
        networkType: 'ripple',
        accountType: 'normal',
        symbol: 'txrp',
        bip44: "m/44'/144'/i'/0/0",
        hasSignVerify: false,
        explorer: {
            tx: 'https://example.com',
            address: 'https://example.com/address/',
        },
    },
    {
        name: 'Bitcoin Cash',
        networkType: 'bitcoin',
        accountType: 'normal',
        symbol: 'bch',
        bip44: "m/44'/145'/i'",
        hasSignVerify: false,
        explorer: {
            tx: 'https://example.com',
            address: 'https://example.com/address/',
        },
    },
    {
        name: 'Bitcoin Gold',
        networkType: 'bitcoin',
        accountType: 'normal',
        symbol: 'btg',
        bip44: "m/49'/156'/i'",
        hasSignVerify: true,
        explorer: {
            tx: 'https://example.com',
            address: 'https://example.com/address/',
        },
    },
    {
        name: 'Bitcoin Gold (legacy)',
        networkType: 'bitcoin',
        accountType: 'legacy',
        symbol: 'btg',
        bip44: "m/49'/156'/i'",
        hasSignVerify: true,
        explorer: {
            tx: 'https://example.com',
            address: 'https://example.com/address/',
        },
    },
    {
        name: 'Dash',
        networkType: 'bitcoin',
        accountType: 'normal',
        symbol: 'dash',
        bip44: "m/44'/5'/i'",
        hasSignVerify: true,
        explorer: {
            tx: 'https://example.com',
            address: 'https://example.com/address/',
        },
    },
    {
        name: 'DigiByte',
        networkType: 'bitcoin',
        accountType: 'normal',
        symbol: 'dgb',
        bip44: "m/49'/20'/i'",
        hasSignVerify: true,
        explorer: {
            tx: 'https://example.com',
            address: 'https://example.com/address/',
        },
    },
    {
        name: 'DigiByte (legacy)',
        networkType: 'bitcoin',
        accountType: 'legacy',
        symbol: 'dgb',
        bip44: "m/44'/20'/i'",
        hasSignVerify: true,
        explorer: {
            tx: 'https://example.com',
            address: 'https://example.com/address/',
        },
    },
    {
        name: 'Dogecoin',
        networkType: 'bitcoin',
        accountType: 'normal',
        symbol: 'doge',
        bip44: "m/44'/3'/i'",
        hasSignVerify: true,
        explorer: {
            tx: 'https://example.com',
            address: 'https://example.com/address/',
        },
    },
    {
        name: 'Namecoin',
        networkType: 'bitcoin',
        accountType: 'normal',
        symbol: 'nmc',
        bip44: "m/44'/7'/i'",
        hasSignVerify: true,
        explorer: {
            tx: 'https://example.com',
            address: 'https://example.com/address/',
        },
    },
    {
        name: 'Vertcoin',
        networkType: 'bitcoin',
        accountType: 'normal',
        symbol: 'vtc',
        bip44: "m/49'/28'/i'",
        hasSignVerify: true,
        explorer: {
            tx: 'https://example.com',
            address: 'https://example.com/address/',
        },
    },
    {
        name: 'Vertcoin (legacy)',
        networkType: 'bitcoin',
        accountType: 'legacy',
        symbol: 'vtc',
        bip44: "m/44'/28'/i'",
        hasSignVerify: true,
        explorer: {
            tx: 'https://example.com',
            address: 'https://example.com/address/',
        },
    },
    {
        name: 'Zcash',
        networkType: 'bitcoin',
        accountType: 'normal',
        symbol: 'zec',
        bip44: "m/44'/133'/i'",
        hasSignVerify: true,
        explorer: {
            tx: 'https://example.com',
            address: 'https://example.com/address/',
        },
    },
];
