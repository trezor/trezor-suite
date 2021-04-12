export default {
    blockbook: [
        {
            description: 'Successful',
            params: 0,
            serverFixtures: [
                {
                    method: 'getBlockHash',
                    response: {
                        data: { hash: 'A' },
                    },
                },
            ],
            response: 'A',
        },
        {
            description: 'Error',
            params: 0,
            serverFixtures: [
                {
                    method: 'getBlockHash',
                    response: {
                        data: { error: { message: 'Error message' } },
                    },
                },
            ],
            error: 'Error message',
        },
    ],
    ripple: [
        {
            description: 'getBlockHash - not implemented',
            params: 0,
            error: 'Unknown message type: m_get_block_hash',
        },
    ],
    blockfrost: [
        {
            description: 'Successful',
            params: 0,
            serverFixtures: [
                {
                    method: 'GET_BLOCK',
                    response: {
                        data: { hash: 'test_hash_value' },
                    },
                },
            ],
            response: 'test_hash_value',
        },
        {
            description: 'Error',
            params: 0,
            serverFixtures: [
                {
                    method: 'GET_BLOCK',
                    response: {
                        data: { error: { message: 'Error message' } },
                    },
                },
            ],
            error: 'Error message',
        },
    ],
};
