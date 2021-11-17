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
    blockfrost: [
        {
            description: 'Many utxos',
            params: 'addr1q8u5ktsj5zsmhvwv0ep9zuhfu39x3wyt9wxjnsn3cagsyy59ckxhkvuc5xj49rw6zrp443wlygmhv8gwcu38jk6ms6usrmcafl',
            response: [
                {
                    address:
                        'addr1q8u5ktsj5zsmhvwv0ep9zuhfu39x3wyt9wxjnsn3cagsyy59ckxhkvuc5xj49rw6zrp443wlygmhv8gwcu38jk6ms6usrmcafl',
                    txid: '96a4ed36f2f117ba0096b7f3c8f28b6dbca0846cbb15662f90fa7b0b08fc7529',
                    confirmations: 280424,
                    blockHeight: 5553000,
                    amount: '1518517',
                    vout: 0,
                    cardanoSpecific: {
                        unit: 'lovelace',
                    },
                },
                {
                    address:
                        'addr1q8u5ktsj5zsmhvwv0ep9zuhfu39x3wyt9wxjnsn3cagsyy59ckxhkvuc5xj49rw6zrp443wlygmhv8gwcu38jk6ms6usrmcafl',
                    txid: '96a4ed36f2f117ba0096b7f3c8f28b6dbca0846cbb15662f90fa7b0b08fc7529',
                    confirmations: 280424,
                    blockHeight: 5553000,
                    amount: '1',
                    vout: 0,
                    cardanoSpecific: {
                        unit: '2f712364ec46f0cf707d412106ce71ef3370f76e27fb56b6bb14708776657465726e696b4e657a6a6564656e79',
                    },
                },
                {
                    address:
                        'addr1q99hnk2vnx708l86mujpfs9end50em9s95grhe3v4933m259ckxhkvuc5xj49rw6zrp443wlygmhv8gwcu38jk6ms6usr7qlze',
                    txid: 'd9a8ae2194e2e25e8079a04a4694e2679464a4f51512863a0008a35a85762ff0',
                    confirmations: 428416,
                    blockHeight: 5405008,
                    amount: '35347470',
                    vout: 1,
                    cardanoSpecific: {
                        unit: 'lovelace',
                    },
                },
            ],
        },
    ],
};
