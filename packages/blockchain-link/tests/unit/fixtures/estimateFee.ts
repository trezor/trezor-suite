export default {
    blockbook: [
        {
            description: 'Successful',
            params: { blocks: [1] },
            serverFixtures: [
                {
                    method: 'estimateFee',
                    response: {
                        data: [{ feePerUnit: '1000' }],
                    },
                },
            ],
            response: [{ feePerUnit: '1000' }],
        },
        {
            description: 'Default',
            params: {},
            serverFixtures: [
                {
                    method: 'estimateFee',
                    response: {
                        data: [],
                    },
                },
            ],
            response: [],
        },
        {
            description: 'Unsuccessful (invalid params)',
            params: { blocks: 1 },
            serverFixtures: [
                {
                    method: 'estimateFee',
                    response: {
                        data: {
                            error: {
                                message:
                                    'json: cannot unmarshal number into Go struct field estimateFeeReq.blocks of type []int',
                            },
                        },
                    },
                },
            ],
            error: 'json: cannot unmarshal number into Go struct field estimateFeeReq.blocks of type []int',
        },
    ],
    ripple: [
        {
            description: 'Successfull',
            params: { blocks: [1] },
            response: [{ feePerUnit: '12' }],
        },
    ],
    blockfrost: [
        {
            description: 'Successfull',
            params: {},
            response: [{ feePerUnit: '44' }],
        },
    ],
};
