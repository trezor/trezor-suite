export default {
    valid: [
        {
            description: 'Bitcoin Cash 1 in 2 out',
            network: 'bitcoincash',
            id: '502e8577b237b0152843a416f8f1ab0c63321b1be7a8cad7bf5c5c216fcf062c',
            hash: '2c06cf6f215c5cbfd7caa8e71b1b32630cabf1f816a4432815b037b277852e50',
            hex: '0100000001781a716b1e15b41b07157933e5d777392a75bf87132650cb2e7d46fb8dc237bc000000006a473044022061aee4f17abe044d5df8c52c9ffd3b84e5a29743517e488b20ecf1ae0b3e4d3a02206bb84c55e407f3b684ff8d9bea0a3409cfd865795a19d10b3d3c31f12795c34a412103a020b36130021a0f037c1d1a02042e325c0cb666d6478c1afdcd9d913b9ef080ffffffff0272ee1c00000000001976a914b1401fce7e8bf123c88a0467e0ed11e3b9fbef5488acec1e0100000000001976a914d51eca49695cdf47e7f4b55507893e3ad53fe9d888ac00000000',
            raw: {
                version: 1,
                locktime: 0,
                ins: [
                    {
                        hash: '781a716b1e15b41b07157933e5d777392a75bf87132650cb2e7d46fb8dc237bc',
                        index: 0,
                        data: '473044022061aee4f17abe044d5df8c52c9ffd3b84e5a29743517e488b20ecf1ae0b3e4d3a02206bb84c55e407f3b684ff8d9bea0a3409cfd865795a19d10b3d3c31f12795c34a412103a020b36130021a0f037c1d1a02042e325c0cb666d6478c1afdcd9d913b9ef080',
                        sequence: 4294967295,
                    },
                ],
                outs: [
                    {
                        value: '1896050',
                        script: 'OP_DUP OP_HASH160 b1401fce7e8bf123c88a0467e0ed11e3b9fbef54 OP_EQUALVERIFY OP_CHECKSIG',
                    },
                    {
                        value: '73452',
                        script: 'OP_DUP OP_HASH160 d51eca49695cdf47e7f4b55507893e3ad53fe9d8 OP_EQUALVERIFY OP_CHECKSIG',
                    },
                ],
            },
            coinbase: false,
            virtualSize: 225,
            weight: 900,
        },
    ],
};
