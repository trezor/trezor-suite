// TODO: unify network objects structure
export default [
    {
        order: 1,
        isHidden: false,
        type: 'bitcoin',
        name: 'Bitcoin',
        symbol: 'BTC',
        bip44: "m/44'/0'/0'/0",
        shortcut: 'btc',
        hasSignVerify: true,
        explorer: {
            tx: 'https://example.com',
            address: 'https://example.com/address/',
        },
    },
    {
        order: 2,
        type: 'ethereum',
        name: 'Ethereum',
        symbol: 'ETH',
        shortcut: 'eth',
        bip44: "m/44'/60'/0'/0",
        chainId: 1,
        defaultGasPrice: 64,
        defaultGasLimit: 21000,
        defaultGasLimitTokens: 200000,
        decimals: 18,
        web3: ['wss://eth2.trezor.io/geth'],
        explorer: {
            tx: 'https://etherscan.io/tx/',
            address: 'https://etherscan.io/address/',
        },
        hasSignVerify: true,
    },
    {
        order: 18,
        type: 'ethereum',
        name: 'Ethereum Classic',
        symbol: 'ETC',
        shortcut: 'etc',
        chainId: 61,
        bip44: "m/44'/61'/0'/0",
        defaultGasPrice: 64,
        defaultGasLimit: 21000,
        defaultGasLimitTokens: 200000,
        decimals: 18,
        web3: ['wss://etc2.trezor.io/geth'],
        explorer: {
            tx: 'https://gastracker.io/tx/',
            address: 'https://gastracker.io/addr/',
        },
        hasSignVerify: true,
    },
    {
        order: 2,
        type: 'ethereum',
        name: 'Ethereum Ropsten',
        testnet: true,
        symbol: 'tROP',
        shortcut: 'trop',
        chainId: 3,
        bip44: "m/44'/60'/0'/0",
        defaultGasPrice: 64,
        defaultGasLimit: 21000,
        defaultGasLimitTokens: 200000,
        decimals: 18,
        fee: {
            defaultFee: '64',
            minFee: '10',
            maxFee: '10000',
            defaultGasLimit: '21000',
            defaultGasLimitTokens: '200000',
            levels: [
                {
                    name: 'High',
                    value: '96',
                    multiplier: 1.5,
                },
                {
                    name: 'Normal',
                    value: '64',
                    multiplier: 1,
                    recommended: true,
                },
                {
                    name: 'Low',
                    value: '48',
                    multiplier: 0.75,
                },
            ],
        },
        web3: ['wss://ropsten1.trezor.io/geth'],
        explorer: {
            tx: 'https://ropsten.etherscan.io/tx/',
            address: 'https://ropsten.etherscan.io/address/',
        },
        hasSignVerify: true,
    },
    {
        order: 3,
        type: 'ripple',
        name: 'Ripple',
        symbol: 'XRP',
        shortcut: 'xrp',
        bip44: "m/44'/144'/a'/0/0",
        decimals: 6,
        fee: {
            defaultFee: '12',
            minFee: '10',
            maxFee: '10000',
            levels: [
                {
                    name: 'Normal',
                    value: '12',
                    recommended: true,
                },
            ],
        },
        explorer: {
            tx: 'https://xrpscan.com/tx/',
            address: 'https://xrpscan.com/account/',
        },
        hasSignVerify: false,
    },
    {
        order: 3,
        type: 'ripple',
        name: 'Ripple Testnet',
        testnet: true,
        symbol: 'tXRP',
        shortcut: 'txrp',
        bip44: "m/44'/144'/a'/0/0",
        decimals: 6,
        fee: {
            defaultFee: '12',
            minFee: '10',
            maxFee: '10000',
            levels: [
                {
                    name: 'Normal',
                    value: '12',
                    recommended: true,
                },
            ],
        },
        explorer: {
            tx: 'https://sisyfos.trezor.io/ripple-testnet-explorer/tx/',
            address: 'https://sisyfos.trezor.io/ripple-testnet-explorer/address/',
        },
        hasSignVerify: false,
    },
];
