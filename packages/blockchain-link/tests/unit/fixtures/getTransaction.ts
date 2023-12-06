const blockbookFixture = {
    txid: '28451eff296d05f25cdb08c8bb7956d4f18d0c1e09fe4a1d337f347afdf9a7a1',
    version: 2,
    vin: [
        {
            sequence: 4294967295,
            n: 0,
            coinbase: '03a4f617041fba365d2f4d696e65642042792048454c4c4f2fffffffffafcb4c0000000000',
        },
    ],
    vout: [
        {
            value: '39165971',
            n: 0,
            hex: '76a91431938090e8a00edb2a42a8fbcf1a56d99de43bc988ac',
            addresses: ['mk3675zxfeALS4HQAeJRg3RcCVQu9n9UKL'],
        },
    ],
    blockHash: '000000000000022747397f56535069af6ef9f668acf2a1b205b983869b61b6b5',
    blockHeight: 1570468,
    confirmations: 2,
    blockTime: 1563867679,
    value: '39165971',
    valueIn: '0',
    fees: '0',
    size: 122,
    vsize: 122,
    hex: '02000000010000000000000000000000000000000000000000000000000000000000000000ffffffff2503a4f617041fba365d2f4d696e65642042792048454c4c4f2fffffffffafcb4c0000000000ffffffff0113a05502000000001976a91431938090e8a00edb2a42a8fbcf1a56d99de43bc988ac00000000',
};

const blockbookTx = {
    type: 'unknown',
    txid: blockbookFixture.txid,
    details: {
        vin: blockbookFixture.vin,
        vout: blockbookFixture.vout,
        size: blockbookFixture.size,
        totalInput: blockbookFixture.valueIn,
        totalOutput: blockbookFixture.value,
    },
    amount: blockbookFixture.value,
    blockHash: blockbookFixture.blockHash,
    blockHeight: blockbookFixture.blockHeight,
    blockTime: blockbookFixture.blockTime,
    fee: blockbookFixture.fees,
    feeRate: '0',
    vsize: blockbookFixture.vsize,
    hex: blockbookFixture.hex,
    internalTransfers: [],
    targets: [],
    tokens: [],
};

const blockfrostFixture = {
    hash: 'deadbeef',
    block: 'e6369fee087d31192016b1659f1c381e9fc4925339278a4eef6f340c96c1947f',
    block_height: 5040611,
    slot: 15650536,
    index: 0,
    output_amount: [
        {
            unit: 'lovelace',
            quantity: '701374004958',
        },
    ],
    fees: '874781',
    deposit: '0',
    size: 16346,
    invalid_before: null,
    invalid_hereafter: '15657684',
    utxo_count: 80,
    withdrawal_count: 0,
    delegation_count: 0,
    stake_cert_count: 0,
    pool_update_count: 0,
    pool_retire_count: 0,
};

const blockfrostTx = {
    type: 'unknown',
    txid: 'deadbeef',
    amount: blockfrostFixture.output_amount[0].quantity,
    blockHash: blockfrostFixture.block,
    blockHeight: blockfrostFixture.block_height,
    fee: blockfrostFixture.fees,
    details: { vin: [], vout: [], size: blockfrostFixture.size, totalInput: '0', totalOutput: '0' },
    targets: [],
    tokens: [],
    internalTransfers: [],
    cardanoSpecific: {},
};

const xrpFixture = {
    Account: 'rB8Ai21NLgz85T9js2fKAVTVEDZnbTn8Eu',
    Amount: '10000000',
    Destination: 'rHb9CJAWyB4rj91VRWn96DkukG4bwdtyTh',
    DestinationTag: 1000000999,
    Fee: '12',
    Flags: 2147483648,
    LastLedgerSequence: 21230993,
    Sequence: 176,
    SigningPubKey: '02EEFCFCDC10B7ADAD61C9DF80AEF746A7D2439B52AA5155E6D21B4008CDB6AC43',
    TransactionType: 'Payment',
    TxnSignature:
        '3045022100EE2DC777F71513EEAEC9E6F61F8A83FB0ED4C1278D634B71937142F6934C7BCE02200C33939DA39B5654D67B659265ED3616C9C7B66BE864FDED523FA47B336DF539',
    date: 617181871,
    hash: '34E5B5A710421589B868FDFB5BF9AAD2C08352ED0886E17800867A89FBD317D3',
    inLedger: 21230990,
    ledger_index: 21230990,
    validated: true,
};

const xrpTx = {
    txid: xrpFixture.hash,
    type: 'unknown',
    blockHeight: xrpFixture.ledger_index,
    blockHash: xrpFixture.hash,
    blockTime: xrpFixture.date + 946684800,
    amount: xrpFixture.Amount,
    fee: xrpFixture.Fee,

    targets: [],
    tokens: [],
    internalTransfers: [],
    details: { size: 0, totalInput: '0', totalOutput: '0', vin: [], vout: [] },
};

export default {
    blockbook: [
        {
            description: 'Successful',
            params: '28451eff296d05f25cdb08c8bb7956d4f18d0c1e09fe4a1d337f347afdf9a7a1',
            serverFixtures: [
                {
                    method: 'getTransaction',
                    response: {
                        data: blockbookFixture,
                    },
                },
            ],
            response: blockbookTx,
        },
        {
            description: 'Not found',
            params: 'AA',
            error: 'Transaction not found',
        },
    ],
    ripple: [
        {
            description: 'Successful',
            params: '6390FE5EE3B22239B2CA403C32DAFCA613B7FEEE55473A50CB8602CE0FE3EB3F',
            serverFixtures: [
                {
                    method: 'tx',
                    response: {
                        type: 'response',
                        status: 'success',
                        result: xrpFixture,
                    },
                },
            ],
            response: xrpTx,
        },
        {
            description: 'Not found',
            params: '6390FE5EE3B22239B2CA403C32DAFCA613B7FEEE55473A50CB8602CE0FE3EB3F',
            error: 'Transaction not found',
        },
    ],
    blockfrost: [
        {
            description: 'Successful',
            params: '28172ea876c3d1e691284e5179fae2feb3e69d7d41e43f8023dc380115741026',
            serverFixtures: [{ method: 'GET_TRANSACTION', response: { data: blockfrostFixture } }],
            response: blockfrostTx,
        },
        {
            description: 'Not found',
            serverFixtures: [
                {
                    method: 'GET_TRANSACTION',
                    response: {
                        data: {
                            error: {
                                status_code: 404,
                                error: 'Not Found',
                                message: 'The requested component has not been found.',
                            },
                        },
                    },
                },
            ],
            params: 'non_existing_tx',
            error: 'The requested component has not been found.',
        },
    ],
};
