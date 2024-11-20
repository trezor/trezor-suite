// fixtures: https://github.com/trezor/trezor-firmware/blob/main/tests/device_tests/bitcoin/test_signtx_payreq.py

const { TX_CACHE } = global.TestUtils;

export default {
    method: 'signTransaction',
    setup: {
        mnemonic: 'mnemonic_all',
        settings: {
            experimental_features: true,
        },
    },
    tests: [
        {
            description: 'Testnet (Bech32/P2WPKH): Payment request success',
            skip: ['1', '<2.4.4'], // payment requests are not implemented in T1B1 and < 2.4.4
            params: {
                coin: 'Testnet',
                inputs: [
                    {
                        address_n: "m/84'/1'/0'/0/0",
                        amount: 12300000,
                        prev_hash:
                            'b223a7123d0d1e64ee7924617be88d0ccbe745fefca1bcf286ea2158e80593e2',
                        prev_index: 0,
                        script_type: 'SPENDWITNESS',
                    },
                ],
                outputs: [
                    {
                        address: '2N4Q5FhU2497BryFfUgbqkAJE87aKHUhXMp',
                        amount: 5000000,
                        script_type: 'PAYTOADDRESS',
                        payment_req_index: 0,
                    },
                    {
                        address: 'tb1q694ccp5qcc0udmfwgp692u2s2hjpq5h407urtu',
                        amount: 2000000,
                        script_type: 'PAYTOADDRESS',
                        payment_req_index: 0,
                    },
                    {
                        // tb1qkvwu9g3k2pdxewfqr7syz89r3gj557l3uuf9r9
                        address_n: "m/84'/1'/0'/0/0",
                        amount: 12300000 - 5000000 - 2000000 - 11000,
                        script_type: 'PAYTOWITNESS',
                        payment_req_index: 0,
                    },
                ],
                paymentRequests: [
                    {
                        recipient_name: 'trezor.io',
                        amount: 7000000,
                        signature:
                            'e55cca054e19dd52b12a7dc4ad363665b2f85a9b578446d7398cc5cfd43df1913868c444e683fd2b1802cd01c0e8ddd7cb88360836919dba5e3d65531f3aee89',
                    },
                ],
                refTxs: TX_CACHE(['b223a7'], true),
            },
            result: {
                serializedTx:
                    '02000000000101e29305e85821ea86f2bca1fcfe45e7cb0c8de87b612479ee641e0d3d12a723b20000000000ffffffff03404b4c000000000017a9147a55d61848e77ca266e79a39bfc85c580a6426c98780841e0000000000160014d16b8c0680c61fc6ed2e407455715055e41052f528b4500000000000160014b31dc2a236505a6cb9201fa0411ca38a254a7bf10247304402207988f7bda2ca1f32c78a62a508a7fe9f43585dfd60729530eb62e7ec39e1403b02204f73d4d4964d24f0e3806af826eb82b86a9ccb25a99a8ac302cc000cf33f2c85012103adc58245cf28406af0ef5cc24b8afba7f1be6c72f279b642d85c48798685f86200000000',
            },
        },
    ],
};
