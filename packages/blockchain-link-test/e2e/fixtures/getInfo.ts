export default {
    blockbook: [
        {
            description: 'Success',
            response: {
                blockHeight: 1,
                decimals: 9,
                name: 'TestMock',
                shortcut: 'test',
                network: 'test',
            },
        },
        {
            description: 'Zcash consensus branch id',
            serverFixtures: [
                {
                    method: 'getInfo',
                    response: {
                        data: {
                            name: 'Zcash',
                            shortcut: 'zec',
                            network: 'zec',
                            decimals: 8,
                            bestHeight: 1,
                            backend: {
                                consensus: {
                                    chaintip: 'c2d6d0b4',
                                },
                            },
                        },
                    },
                },
            ],
            response: {
                blockHeight: 1,
                decimals: 8,
                name: 'Zcash',
                shortcut: 'zec',
                network: 'zec',
                consensusBranchId: 3268858036,
            },
        },
        {
            description: 'BASE L2 network',
            serverFixtures: [
                {
                    method: 'getInfo',
                    response: {
                        data: {
                            name: 'Base Archive',
                            shortcut: 'ETH',
                            network: 'BASE',
                            decimals: 18,
                            bestHeight: 23603976,
                            backend: {
                                version: 'Geth/v1.101411.2-stable-3dd9b027/linux-amd64/go1.23.3',
                            },
                        },
                    },
                },
            ],
            response: {
                name: 'Base Archive',
                shortcut: 'ETH',
                network: 'BASE',
                decimals: 18,
                blockHeight: 23603976,
            },
        },
        {
            description: 'Error',
            serverFixtures: [
                {
                    method: 'getInfo',
                    response: {
                        data: { error: { message: 'Error msg' } },
                    },
                },
            ],
            error: 'Error msg',
        },
    ],
    ripple: [
        {
            description: 'Success',
            response: {
                blockHeight: 1,
                blockHash: '1',
                decimals: 6,
                name: 'Ripple',
                shortcut: 'xrp',
                network: 'xrp',
                testnet: false,
                version: '1.4.0',
            },
        },
        {
            description: 'Error',
            serverFixtures: [
                {
                    method: 'server_info',
                    response: {
                        status: 'error',
                        type: 'response',
                        error_message: 'Error msg',
                    },
                },
            ],
            error: 'RippledError Error msg',
        },
    ],
    blockfrost: [
        {
            description: 'Success',
            response: {
                blockHeight: 1,
                blockHash: 'test_block_hash-hash',
                decimals: 6,
                name: 'BlockfrostMock',
                shortcut: 'ada',
                network: 'ada',
                testnet: false,
                version: '1.4.0',
            },
        },
        {
            description: 'Error',
            serverFixtures: [
                {
                    method: 'GET_SERVER_INFO',
                    response: {
                        data: {
                            error: { message: 'BlockfrostError Error msg' },
                        },
                    },
                },
            ],
            error: 'BlockfrostError Error msg',
        },
    ],
};
