import type { DeepPartial } from '@trezor/type-utils';
import type { AccountInfo, AccountInfoParams } from '../../../src/types';
import type { AccountInfo as BlockbookAccountInfo } from '../../../src/types/blockbook';

const fixtures: {
    description: string;
    params: AccountInfoParams;
    serverFixtures: {
        method: string;
        response: { data: DeepPartial<BlockbookAccountInfo> | { error: any } };
    }[];
    response?: DeepPartial<AccountInfo>;
    error?: string;
}[] = [
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
                                // @ts-expect-error
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
                                    isAccountOwned: true,
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
                                    isAccountOwned: true,
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
                                    isAccountOwned: true,
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
                                // @ts-expect-error
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
                            // @ts-expect-error
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
    {
        description: 'BTC account with vsize and feeRate',
        params: {
            descriptor:
                'vpub5YX1yJFY8E236pH3iNvCpThsXLxoQoC4nwraaS5h4TZwaSp1Gg9SQoxCsrumxjh7nZRQQkNfH29TEDeMvAZVmD3rpmsDnFc5Sj4JgJG6m4b',
        },

        serverFixtures: [
            {
                method: 'getAccountInfo',
                response: {
                    data: {
                        page: 1,
                        totalPages: 1,
                        itemsOnPage: 25,
                        address:
                            'vpub5YX1yJFY8E236pH3iNvCpThsXLxoQoC4nwraaS5h4TZwaSp1Gg9SQoxCsrumxjh7nZRQQkNfH29TEDeMvAZVmD3rpmsDnFc5Sj4JgJG6m4b',
                        balance: '41159',
                        totalReceived: '773325477',
                        totalSent: '773284318',
                        unconfirmedBalance: '0',
                        unconfirmedTxs: 0,
                        txs: 1,
                        transactions: [
                            {
                                txid: '7f42f8e47f8af81a333ec622bf5688499f00e1f9b2d5f89865609e1663ad4a89',
                                version: 1,
                                vin: [],
                                vout: [],
                                blockHash:
                                    '00000000000ec214f1cc387e3d6f781118378afca5c4b0a325f8f97353f1365d',
                                blockHeight: 2349586,
                                confirmations: 4,
                                blockTime: 1665050739,
                                size: 222,
                                vsize: 141,
                                value: '40577',
                                valueIn: '40859',
                                fees: '282',
                                hex: '01000000000101a5818c7911116e6dd1e1f2017701071f3165aeff48d296cfb439ed9f266aefc30100000000fdffffff02d007000000000000160014f8e00fa515aea7693cf042c1e18d9ab345185cecb196000000000000160014fcf1910a28fba7613b92ee64aa6615e1a31a17330247304402202b4671022b7ce8d40775565b8c90cdd63e58188475f2a9658a89e2765fbf92d902203b29a451839e5c6983dec5139cb376e015cf8c54cb51deb8d21b53d6ba0773b401210355b9248c4643574b56c8beae840d0f341da456855f7f0a88527d66282fd6fb4900000000',
                            },
                        ],
                        tokens: [],
                    },
                },
            },
        ],

        response: {
            descriptor:
                'vpub5YX1yJFY8E236pH3iNvCpThsXLxoQoC4nwraaS5h4TZwaSp1Gg9SQoxCsrumxjh7nZRQQkNfH29TEDeMvAZVmD3rpmsDnFc5Sj4JgJG6m4b',
            empty: false,
            balance: '41159',
            availableBalance: '41159',
            history: {
                total: 1,
                unconfirmed: 0,
                transactions: [
                    {
                        type: 'unknown',
                        txid: '7f42f8e47f8af81a333ec622bf5688499f00e1f9b2d5f89865609e1663ad4a89',
                        blockTime: 1665050739,
                        blockHeight: 2349586,
                        blockHash:
                            '00000000000ec214f1cc387e3d6f781118378afca5c4b0a325f8f97353f1365d',
                        amount: '40577',
                        fee: '282',
                        vsize: 141,
                        feeRate: '2',
                        targets: [],
                        tokens: [],
                        details: {
                            vin: [],
                            vout: [],
                            size: 222,
                            totalInput: '0',
                            totalOutput: '0',
                        },
                    },
                ],
            },

            page: {
                index: 1,
                size: 25,
                total: 1,
            },
        },
    },
];

export default fixtures;
