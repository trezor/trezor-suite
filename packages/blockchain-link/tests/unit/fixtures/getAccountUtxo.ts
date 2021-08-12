export default {
    blockbook: [
        {
            description: 'Not supported',
            params: 'A',
            serverFixtures: [
                {
                    method: 'getAccountUtxo',
                    response: {
                        data: { error: { message: 'Not supported' } },
                    },
                },
            ],
            error: 'Not supported',
        },
        {
            description: 'empty account',
            params: {
                descriptor: 'A',
            },
            response: [],
        },
        {
            description: 'Testnet account with 1 utxo',
            params: 'upub5Df5hVPH2yM4Khs85P8nkq3x9GRcvX3FgDitXDcqSJDXgMJjVmpWPRqwqHExjQcezkjDDyU1u3ij1wUPXHaYqRHehuGtBvSPzcocpKu3wUz',
            serverFixtures: [
                {
                    method: 'getAccountUtxo',
                    response: {
                        data: [
                            {
                                address: '2N1VPCeEUXFdZepHJgbzSZgoi6nGrGFgeRH',
                                confirmations: 116338,
                                height: 1450749,
                                path: "m/49'/1'/0'/1/0",
                                txid: 'ee7720c3350ff500b8b6a3a477fb71ef35e37c18f1929a586324791e6c5a11dd',
                                value: '18833',
                                vout: 1,
                            },
                        ],
                    },
                },
            ],
            response: [
                {
                    txid: 'ee7720c3350ff500b8b6a3a477fb71ef35e37c18f1929a586324791e6c5a11dd',
                    vout: 1,
                    amount: '18833',
                    blockHeight: 1450749,
                    address: '2N1VPCeEUXFdZepHJgbzSZgoi6nGrGFgeRH',
                    path: "m/49'/1'/0'/1/0",
                    confirmations: 116338,
                },
            ],
        },
        {
            description: 'Testnet account with undefined amount',
            params: 'upub5Df5hVPH2yM4Khs85P8nkq3x9GRcvX3FgDitXDcqSJDXgMJjVmpWPRqwqHExjQcezkjDDyU1u3ij1wUPXHaYqRHehuGtBvSPzcocpKu3wUz',
            serverFixtures: [
                {
                    method: 'getAccountUtxo',
                    response: {
                        data: [
                            {
                                address: '2N1VPCeEUXFdZepHJgbzSZgoi6nGrGFgeRH',
                                confirmations: 116338,
                                height: 1450749,
                                path: "m/49'/1'/0'/1/0",
                                txid: 'ee7720c3350ff500b8b6a3a477fb71ef35e37c18f1929a586324791e6c5a11dd',
                                value: undefined,
                                vout: 1,
                            },
                        ],
                    },
                },
            ],
            response: [
                {
                    txid: 'ee7720c3350ff500b8b6a3a477fb71ef35e37c18f1929a586324791e6c5a11dd',
                    vout: 1,
                    blockHeight: 1450749,
                    address: '2N1VPCeEUXFdZepHJgbzSZgoi6nGrGFgeRH',
                    path: "m/49'/1'/0'/1/0",
                    confirmations: 116338,
                },
            ],
        },
    ],
    ripple: [
        {
            description: 'getAccountUtxo - not implemented',
            params: 'A',
            error: 'Unknown message type: m_get_account_utxo',
        },
    ],
};
