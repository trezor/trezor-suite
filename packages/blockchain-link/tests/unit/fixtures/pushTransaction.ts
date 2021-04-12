export default {
    blockbook: [
        {
            description: 'Successful',
            params: 'A',
            serverFixtures: [
                {
                    method: 'sendTransaction',
                    response: {
                        data: { result: 'HEX' },
                    },
                },
            ],
            response: 'HEX',
        },
        {
            description: 'Unsuccessful',
            params: 'A',
            error: '-22: TX decode failed',
        },
    ],
    blockfrost: [
        {
            description: 'Successful',
            params: 'A',
            serverFixtures: [
                {
                    method: 'PUSH_TRANSACTION',
                    response: {
                        data: {
                            result: 'blockfrost_push_tx_result',
                        },
                    },
                },
            ],
            response: 'blockfrost_push_tx_result',
        },
        {
            description: 'Unsuccessful',
            params: 'A',
            error: 'Message not set',
        },
    ],
    ripple: [
        {
            description: 'Successful',
            params: '120000228000000024000000566140000000000F424068400000000000000C732102131FACD1EAB748D6CDDC492F54B04E8C35658894F4ADD2232EBC5AFE7521DBE47447304502210087708F2564B41648EEFD5ABD1EB5E600F758B8FD14DF7992A946760B121B64D302205E91F992D2DAE92DACE12932355ADE076D4F58A1A8CDF8C3F0296380FFE7E7F881148FB40E1FFA5D557CE9851A535AF94965E0DD09888314950ED8DFD390534A1871873975ECE0DFA8DDE703',
            serverFixtures: [
                {
                    method: 'submit',
                    response: {
                        status: 'success',
                        type: 'response',
                        result: {
                            engine_result: 'tesSUCCESS',
                            engine_result_message:
                                'The transaction was applied. Only final in a validated ledger.',
                            engine_result_code: 0,
                            tx_json: {
                                Account: 'rNaqKtKrMSwpwZSzRckPf7S96DkimjkF4H',
                                Amount: '1000000',
                                Destination: 'rNb97BY81ZpzvxHRJytSSrqbx2PJTS2pEd',
                                Fee: '12',
                                Flags: 2147483648,
                                Sequence: 86,
                                SigningPubKey:
                                    '02131FACD1EAB748D6CDDC492F54B04E8C35658894F4ADD2232EBC5AFE7521DBE4',
                                TransactionType: 'Payment',
                                TxnSignature:
                                    '304502210087708F2564B41648EEFD5ABD1EB5E600F758B8FD14DF7992A946760B121B64D302205E91F992D2DAE92DACE12932355ADE076D4F58A1A8CDF8C3F0296380FFE7E7F8',
                                hash: '18F9E23D780F47B2C3B38A88D88E168B7DE5B5EF5DAF12442C88A31080DE9122',
                            },
                        },
                    },
                },
            ],
            response: '18F9E23D780F47B2C3B38A88D88E168B7DE5B5EF5DAF12442C88A31080DE9122',
        },
        {
            description: 'Unsuccessful',
            params: '120000228000000024000000356140000000000F424068400000000000000C732102131FACD1EAB748D6CDDC492F54B04E8C35658894F4ADD2232EBC5AFE7521DBE4744730450221008682092F0A561627903E67F7A4341FE572645E3865E93188F2A3A1E3C1189CC30220297FD141CF257D6933AA63D3C8657B494A42EFC759E315659BD2B760572F4D4581148FB40E1FFA5D557CE9851A535AF94965E0DD09888314950ED8DFD390534A1871873975ECE0DFA8DDE703',
            serverFixtures: [
                {
                    method: 'submit',
                    response: {
                        status: 'success',
                        type: 'response',
                        result: {
                            engine_result: 'tefPAST_SEQ',
                            engine_result_code: -190,
                            engine_result_message: 'This sequence number has already passed.',
                        },
                    },
                },
            ],
            error: 'This sequence number has already passed.',
        },
    ],
};
