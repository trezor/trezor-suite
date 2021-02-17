export default [
    {
        description: 'With server error',
        params: {
            descriptor: 'A',
        },
        serverFixtures: [
            {
                method: 'getAccountInfo',
                response: { data: { error: { message: 'Error message' } } },
            },
        ],
        error: 'Error message',
    },
    {
        description: 'Empty BTC account',
        params: {
            descriptor:
                'xpub6CVKsQYXc9b2MiuW1HisiJKCEyB8vSqEafi6CP6Qu96YABCKScWtm1gUko1yDRSdmPjYQ8eFUbc9qrvNxBTUq2Z19aenEmCFcUcFUJL1Wpu',
        },
        serverFixtures: [
            {
                method: 'getAccountInfo',
                response: {
                    data: {
                        address:
                            'xpub6CVKsQYXc9b2MiuW1HisiJKCEyB8vSqEafi6CP6Qu96YABCKScWtm1gUko1yDRSdmPjYQ8eFUbc9qrvNxBTUq2Z19aenEmCFcUcFUJL1Wpu',
                        balance: '0',
                        totalSent: '0',
                        totalReceived: '0',
                        txs: 0,
                        unconfirmedBalance: '0',
                        unconfirmedTxs: 0,
                    },
                },
            },
        ],
        response: {
            descriptor:
                'xpub6CVKsQYXc9b2MiuW1HisiJKCEyB8vSqEafi6CP6Qu96YABCKScWtm1gUko1yDRSdmPjYQ8eFUbc9qrvNxBTUq2Z19aenEmCFcUcFUJL1Wpu',
            balance: '0',
            availableBalance: '0',
            empty: true,
            history: {
                total: 0,
                unconfirmed: 0,
            },
        },
    },
    {
        description: 'BTC account with addresses',
        params: {
            descriptor:
                'xpub6CVKsQYXc9b2MiuW1HisiJKCEyB8vSqEafi6CP6Qu96YABCKScWtm1gUko1yDRSdmPjYQ8eFUbc9qrvNxBTUq2Z19aenEmCFcUcFUJL1Wpu',
        },
        serverFixtures: [
            {
                method: 'getAccountInfo',
                response: {
                    data: {
                        address:
                            'xpub6CVKsQYXc9b2MiuW1HisiJKCEyB8vSqEafi6CP6Qu96YABCKScWtm1gUko1yDRSdmPjYQ8eFUbc9qrvNxBTUq2Z19aenEmCFcUcFUJL1Wpu',
                        balance: '0',
                        totalSent: '0',
                        totalReceived: '0',
                        txs: 0,
                        unconfirmedBalance: '0',
                        unconfirmedTxs: 0,
                        tokens: [
                            {
                                type: 'XPUBAddress',
                                path: "m/44'/0'/100'/1/0",
                                name: '1J8tVQD9KZZeLhnkMRHHDawsYmwjWAnC5d',
                                transfers: 0,
                            },
                            {
                                type: 'XPUBAddress',
                                path: "m/44'/0'/100'/0/0",
                                name: '19SW698tGLusJZVBmGDYmHvSwn79WqJP65',
                                transfers: 0,
                            },
                        ],
                    },
                },
            },
        ],
        response: {
            descriptor:
                'xpub6CVKsQYXc9b2MiuW1HisiJKCEyB8vSqEafi6CP6Qu96YABCKScWtm1gUko1yDRSdmPjYQ8eFUbc9qrvNxBTUq2Z19aenEmCFcUcFUJL1Wpu',
            balance: '0',
            availableBalance: '0',
            empty: true,
            addresses: {
                change: [
                    {
                        path: "m/44'/0'/100'/1/0",
                        address: '1J8tVQD9KZZeLhnkMRHHDawsYmwjWAnC5d',
                        transfers: 0,
                    },
                ],
                used: [],
                unused: [
                    {
                        path: "m/44'/0'/100'/0/0",
                        address: '19SW698tGLusJZVBmGDYmHvSwn79WqJP65',
                        transfers: 0,
                    },
                ],
            },
            history: {
                total: 0,
                unconfirmed: 0,
            },
        },
    },
    {
        description: 'BTC account with invalid addresses',
        params: {
            descriptor:
                'xpub6CVKsQYXc9b2MiuW1HisiJKCEyB8vSqEafi6CP6Qu96YABCKScWtm1gUko1yDRSdmPjYQ8eFUbc9qrvNxBTUq2Z19aenEmCFcUcFUJL1Wpu',
        },
        serverFixtures: [
            {
                method: 'getAccountInfo',
                response: {
                    data: {
                        address:
                            'xpub6CVKsQYXc9b2MiuW1HisiJKCEyB8vSqEafi6CP6Qu96YABCKScWtm1gUko1yDRSdmPjYQ8eFUbc9qrvNxBTUq2Z19aenEmCFcUcFUJL1Wpu',
                        tokens: [
                            {
                                type: 'not-XPUBAddress',
                                path: "m/44'/0'/100'/1/0",
                                name: '1J8tVQD9KZZeLhnkMRHHDawsYmwjWAnC5d',
                                transfers: 0,
                            },
                        ],
                    },
                },
            },
        ],
        response: {
            descriptor:
                'xpub6CVKsQYXc9b2MiuW1HisiJKCEyB8vSqEafi6CP6Qu96YABCKScWtm1gUko1yDRSdmPjYQ8eFUbc9qrvNxBTUq2Z19aenEmCFcUcFUJL1Wpu',
            empty: false,
            addresses: undefined,
            history: {},
        },
    },
    {
        description: 'BTC account with unconfirmed balance (incoming)',
        params: {
            descriptor:
                'xpub6CVKsQYXc9b2MiuW1HisiJKCEyB8vSqEafi6CP6Qu96YABCKScWtm1gUko1yDRSdmPjYQ8eFUbc9qrvNxBTUq2Z19aenEmCFcUcFUJL1Wpu',
        },
        serverFixtures: [
            {
                method: 'getAccountInfo',
                response: {
                    data: {
                        address:
                            'xpub6CVKsQYXc9b2MiuW1HisiJKCEyB8vSqEafi6CP6Qu96YABCKScWtm1gUko1yDRSdmPjYQ8eFUbc9qrvNxBTUq2Z19aenEmCFcUcFUJL1Wpu',
                        balance: '0',
                        unconfirmedBalance: '1',
                        txs: 1,
                        tokens: [
                            {
                                type: 'XPUBAddress',
                                path: "m/44'/0'/100'/1/0",
                                name: '1J8tVQD9KZZeLhnkMRHHDawsYmwjWAnC5d',
                                transfers: 1,
                            },
                        ],
                        transactions: [
                            {
                                vin: [
                                    {
                                        addresses: ['19SW698tGLusJZVBmGDYmHvSwn79WqJP65'],
                                        sequence: 4294967293, // RBF
                                        value: '1',
                                    },
                                ],
                                vout: [
                                    {
                                        addresses: ['1J8tVQD9KZZeLhnkMRHHDawsYmwjWAnC5d'],
                                        value: '1',
                                    },
                                ],
                                hex: 'deadbeef',
                            },
                        ],
                        page: 1,
                        itemsOnPage: 25,
                        totalPages: 1,
                    },
                },
            },
        ],
        response: {
            descriptor:
                'xpub6CVKsQYXc9b2MiuW1HisiJKCEyB8vSqEafi6CP6Qu96YABCKScWtm1gUko1yDRSdmPjYQ8eFUbc9qrvNxBTUq2Z19aenEmCFcUcFUJL1Wpu',
            empty: false,
            balance: '0',
            availableBalance: '1',
            history: {
                total: 1,
                transactions: [
                    {
                        type: 'recv',
                        amount: '1',
                        totalSpent: '1',
                        rbf: true,
                        targets: [
                            {
                                addresses: ['1J8tVQD9KZZeLhnkMRHHDawsYmwjWAnC5d'],
                                amount: '1',
                                isAccountTarget: true,
                                n: 0,
                            },
                        ],
                        tokens: [],
                        details: {
                            vin: [
                                {
                                    addresses: ['19SW698tGLusJZVBmGDYmHvSwn79WqJP65'],
                                    sequence: 4294967293,
                                    value: '1',
                                },
                            ],
                            vout: [
                                {
                                    addresses: ['1J8tVQD9KZZeLhnkMRHHDawsYmwjWAnC5d'],
                                    value: '1',
                                },
                            ],
                            size: 4,
                            totalInput: '1',
                            totalOutput: '1',
                        },
                    },
                ],
            },
            addresses: {
                change: [
                    {
                        path: "m/44'/0'/100'/1/0",
                        address: '1J8tVQD9KZZeLhnkMRHHDawsYmwjWAnC5d',
                        transfers: 1,
                    },
                ],
                used: [],
                unused: [],
            },
            page: {
                index: 1,
                size: 25,
                total: 1,
            },
        },
    },
    {
        description: 'BTC account with unconfirmed balance and transaction (outgoing)',
        params: {
            descriptor:
                'xpub6CVKsQYXc9b2MiuW1HisiJKCEyB8vSqEafi6CP6Qu96YABCKScWtm1gUko1yDRSdmPjYQ8eFUbc9qrvNxBTUq2Z19aenEmCFcUcFUJL1Wpu',
        },
        serverFixtures: [
            {
                method: 'getAccountInfo',
                response: {
                    data: {
                        address:
                            'xpub6CVKsQYXc9b2MiuW1HisiJKCEyB8vSqEafi6CP6Qu96YABCKScWtm1gUko1yDRSdmPjYQ8eFUbc9qrvNxBTUq2Z19aenEmCFcUcFUJL1Wpu',
                        balance: '100',
                        unconfirmedBalance: '-60', // output.value + fee
                        txs: 2,
                        tokens: [
                            {
                                type: 'XPUBAddress',
                                path: "m/44'/0'/100'/1/0",
                                name: '1J8tVQD9KZZeLhnkMRHHDawsYmwjWAnC5d',
                                transfers: 2,
                            },
                            {
                                type: 'XPUBAddress',
                                path: "m/44'/0'/100'/1/1",
                                name: '1RXiBGixLSBRAAXtZMsCx75EuFqqJnmXZ',
                                transfers: 1,
                            },
                        ],
                        transactions: [
                            {
                                vin: [
                                    {
                                        addresses: ['1J8tVQD9KZZeLhnkMRHHDawsYmwjWAnC5d'],
                                        value: '100',
                                        sequence: 4294967293, // RBF
                                    },
                                ],
                                vout: [
                                    {
                                        addresses: ['19SW698tGLusJZVBmGDYmHvSwn79WqJP65'],
                                        value: '50',
                                        n: 1,
                                    },
                                    {
                                        addresses: ['1RXiBGixLSBRAAXtZMsCx75EuFqqJnmXZ'],
                                        value: '40',
                                        n: 0,
                                    },
                                ],
                                fees: '10',
                            },
                        ],
                        page: 1,
                        itemsOnPage: 25,
                        totalPages: 1,
                    },
                },
            },
        ],
        response: {
            descriptor:
                'xpub6CVKsQYXc9b2MiuW1HisiJKCEyB8vSqEafi6CP6Qu96YABCKScWtm1gUko1yDRSdmPjYQ8eFUbc9qrvNxBTUq2Z19aenEmCFcUcFUJL1Wpu',
            empty: false,
            balance: '100',
            availableBalance: '40',
            history: {
                total: 2,
                transactions: [
                    {
                        type: 'sent',
                        amount: '50',
                        totalSpent: '60',
                        fee: '10',
                        rbf: true,
                        targets: [
                            {
                                addresses: ['19SW698tGLusJZVBmGDYmHvSwn79WqJP65'],
                                amount: '50',
                                n: 1,
                            },
                        ],
                        tokens: [],
                        details: {
                            vin: [
                                {
                                    addresses: ['1J8tVQD9KZZeLhnkMRHHDawsYmwjWAnC5d'],
                                    sequence: 4294967293,
                                    value: '100',
                                },
                            ],
                            vout: [
                                {
                                    addresses: ['19SW698tGLusJZVBmGDYmHvSwn79WqJP65'],
                                    value: '50',
                                    n: 1,
                                },
                                {
                                    addresses: ['1RXiBGixLSBRAAXtZMsCx75EuFqqJnmXZ'],
                                    value: '40',
                                    n: 0,
                                },
                            ],
                            size: 0,
                            totalInput: '100',
                            totalOutput: '90',
                        },
                    },
                ],
            },
            addresses: {
                change: [
                    {
                        path: "m/44'/0'/100'/1/0",
                        address: '1J8tVQD9KZZeLhnkMRHHDawsYmwjWAnC5d',
                        transfers: 2,
                    },
                    {
                        path: "m/44'/0'/100'/1/1",
                        address: '1RXiBGixLSBRAAXtZMsCx75EuFqqJnmXZ',
                        transfers: 1,
                    },
                ],
                used: [],
                unused: [],
            },
            page: {
                index: 1,
                size: 25,
                total: 1,
            },
        },
    },
    {
        description: 'Empty ETH account',
        params: {
            descriptor: '0x1e6E3708a059aEa1241a81c7aAe84b6CDbC54d59',
        },
        serverFixtures: [
            {
                method: 'getAccountInfo',
                response: {
                    data: {
                        address: '0x1e6E3708a059aEa1241a81c7aAe84b6CDbC54d59',
                        balance: '0',
                        txs: 0,
                        unconfirmedBalance: '0',
                        unconfirmedTxs: 0,
                        nonce: '0',
                    },
                },
            },
        ],
        response: {
            descriptor: '0x1e6E3708a059aEa1241a81c7aAe84b6CDbC54d59',
            balance: '0',
            availableBalance: '0',
            empty: true,
            history: {
                total: 0,
                unconfirmed: 0,
            },
            misc: { nonce: '0' },
        },
    },
    {
        description:
            'ETH account with non-zero balance and 0 txs (blockbook cannot parse internal txs)',
        params: {
            descriptor: '0x1e6E3708a059aEa1241a81c7aAe84b6CDbC54d59',
        },
        serverFixtures: [
            {
                method: 'getAccountInfo',
                response: {
                    data: {
                        address: '0x1e6E3708a059aEa1241a81c7aAe84b6CDbC54d59',
                        balance: '1',
                        txs: 0,
                        unconfirmedBalance: '0',
                        unconfirmedTxs: 0,
                        nonce: '0',
                    },
                },
            },
        ],
        response: {
            descriptor: '0x1e6E3708a059aEa1241a81c7aAe84b6CDbC54d59',
            balance: '1',
            availableBalance: '1',
            empty: false,
            history: {
                total: 0,
                unconfirmed: 0,
            },
            misc: { nonce: '0' },
        },
    },
    {
        description: 'ETH account with tokens',
        params: {
            descriptor: '0x1e6E3708a059aEa1241a81c7aAe84b6CDbC54d59',
        },
        serverFixtures: [
            {
                method: 'getAccountInfo',
                response: {
                    data: {
                        address: '0x1e6E3708a059aEa1241a81c7aAe84b6CDbC54d59',
                        txs: 1,
                        nonTokenTxs: 0,
                        tokens: [
                            {
                                type: 'ERC20',
                                name: 'Token name',
                                symbol: 'TKNNME',
                                contract: '0x0',
                                balance: '1',
                            },
                        ],
                    },
                },
            },
        ],
        response: {
            descriptor: '0x1e6E3708a059aEa1241a81c7aAe84b6CDbC54d59',
            empty: false,
            history: {
                total: 1,
                tokens: 1,
            },
            tokens: [
                {
                    type: 'ERC20',
                    name: 'Token name',
                    symbol: 'TKNNME',
                    address: '0x0',
                    balance: '1',
                    decimals: 0,
                },
            ],
        },
    },
    {
        description: 'ETH account with unknown tokens',
        params: {
            descriptor: '0x1e6E3708a059aEa1241a81c7aAe84b6CDbC54d59',
        },
        serverFixtures: [
            {
                method: 'getAccountInfo',
                response: {
                    data: {
                        address: '0x1e6E3708a059aEa1241a81c7aAe84b6CDbC54d59',
                        tokens: [
                            {
                                type: 'not-ERC20',
                                path: "m/44'/0'/100'/1/0",
                                name: '1J8tVQD9KZZeLhnkMRHHDawsYmwjWAnC5d',
                                transfers: 0,
                            },
                        ],
                    },
                },
            },
        ],
        response: {
            descriptor: '0x1e6E3708a059aEa1241a81c7aAe84b6CDbC54d59',
            empty: false,
            history: {},
        },
    },
    {
        description: 'ETH (Ropsten) smart contract',
        params: {
            descriptor: '0xFc6B5d6af8A13258f7CbD0D39E11b35e01a32F93',
        },
        serverFixtures: [
            {
                method: 'getAccountInfo',
                response: {
                    data: {
                        address: '0xFc6B5d6af8A13258f7CbD0D39E11b35e01a32F93',
                        erc20Contract: {
                            contract: '0xFc6B5d6af8A13258f7CbD0D39E11b35e01a32F93',
                            name: 'Grzegorz Brzęczyszczykiewicz',
                            symbol: 'GRZBRZ',
                            decimals: 3,
                        },
                    },
                },
            },
        ],
        response: {
            descriptor: '0xFc6B5d6af8A13258f7CbD0D39E11b35e01a32F93',
            empty: false,
            history: {},
            misc: {
                erc20Contract: {
                    type: 'ERC20',
                    address: '0xFc6B5d6af8A13258f7CbD0D39E11b35e01a32F93',
                    name: 'Grzegorz Brzęczyszczykiewicz',
                    symbol: 'GRZBRZ',
                    decimals: 3,
                },
            },
        },
    },
    {
        description: 'ETH (Ropsten) smart contract type unknown',
        params: {
            descriptor: '0xFc6B5d6af8A13258f7CbD0D39E11b35e01a32F93',
        },
        serverFixtures: [
            {
                method: 'getAccountInfo',
                response: {
                    data: {
                        address: '0xFc6B5d6af8A13258f7CbD0D39E11b35e01a32F93',
                        erc20Contract: {
                            type: 'not-ERC20',
                        },
                    },
                },
            },
        ],
        response: {
            descriptor: '0xFc6B5d6af8A13258f7CbD0D39E11b35e01a32F93',
            empty: false,
            history: {},
            misc: undefined,
        },
    },
];
