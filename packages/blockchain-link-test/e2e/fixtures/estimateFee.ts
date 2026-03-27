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
            serverFixtures: [
                {
                    method: 'fee',
                    response: {
                        type: 'response',
                        status: 'success',
                        result: {
                            drops: {
                                base_fee: '10',
                                median_fee: '5000',
                                minimum_fee: '10',
                                open_ledger_fee: '10',
                            },
                        },
                    },
                },
            ],
            response: [{ feePerUnit: '10' }],
            error: undefined,
        },
    ],
    blockfrost: [
        {
            description: 'Successfull',
            params: {},
            serverFixtures: undefined,
            response: [{ feePerUnit: '44' }],
            error: undefined,
        },
    ],
};
