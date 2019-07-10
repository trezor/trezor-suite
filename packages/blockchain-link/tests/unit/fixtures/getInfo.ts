export default {
    blockbook: [
        {
            description: 'Success',
            response: {
                blockHeight: 1,
                decimals: 9,
                name: 'Test',
                shortcut: 'test',
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
                testnet: false,
                version: '0.24.0-rc1',
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
            error: 'Error msg',
        },
    ],
};
