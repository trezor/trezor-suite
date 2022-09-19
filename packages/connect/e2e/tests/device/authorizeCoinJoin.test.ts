import TrezorConnect from '@trezor/connect';

const { getController, setup, conditionalTest, initTrezorConnect } = global.Trezor;
const { ADDRESS_N, TX_CACHE } = global.TestUtils;

const controller = getController('applyFlags');

describe('TrezorConnect.authorizeCoinJoin', () => {
    beforeAll(async () => {
        await setup(controller, {
            mnemonic: 'mnemonic_all',
            settings: {
                experimental_features: true,
            },
        });
        await initTrezorConnect(controller, { debug: false });
    });

    afterAll(() => {
        controller.dispose();
        TrezorConnect.dispose();
    });

    conditionalTest(['1', '<2.4.4'], 'Coinjoin success', async () => {
        const auth = await TrezorConnect.authorizeCoinJoin({
            coordinator: 'www.example.com',
            maxRounds: 2,
            maxCoordinatorFeeRate: 50000000, // 0.5 %
            maxFeePerKvbyte: 3500,
            path: ADDRESS_N("m/84'/1'/0'"),
            coin: 'Testnet',
            scriptType: 'SPENDWITNESS',
        });

        expect(auth.success).toBe(true);
        expect(auth.payload).toEqual({ message: 'CoinJoin authorized' });

        // remove all button listeners from initTrezorConnect (common.setup)
        // DebugLink decision SHOULD NOT! be required after authorization
        TrezorConnect.removeAllListeners();

        const commitmentData =
            '0f7777772e6578616d706c652e636f6d0000000000000000000000000000000000000000000000000000000000000001';

        const proof = await TrezorConnect.getOwnershipProof({
            coin: 'Testnet',
            path: ADDRESS_N("m/84'/1'/0'/1/0"),
            scriptType: 'SPENDWITNESS',
            userConfirmation: true, // ButtonRequest is not emitted because of preauthorization
            commitmentData,
            preauthorized: true,
        });

        expect(proof.success).toBe(true);

        const params: Parameters<typeof TrezorConnect.signTransaction>[0] = {
            inputs: [
                {
                    // seed "alcohol woman abuse must during monitor noble actual mixed trade anger aisle"
                    // 84'/1'/0'/0/0
                    // tb1qnspxpr2xj9s2jt6qlhuvdnxw6q55jvygcf89r2
                    amount: 100000,
                    prev_hash: 'e5b7e21b5ba720e81efd6bfa9f854ababdcddc75a43bfa60bf0fe069cfd1bb8a',
                    prev_index: 0,
                    script_type: 'EXTERNAL',
                    script_pubkey: '00149c02608d469160a92f40fdf8c6ccced029493088',
                    ownership_proof:
                        '534c001901016b2055d8190244b2ed2d46513c40658a574d3bc2deb6969c0535bb818b44d2c40002483045022100a6c7d59b453efa7b4abc9bc724a94c5655ae986d5924dc29d28bcc2b859cbace022047d2bc4422a47f7b044bd6cdfbf63fe1a0ecbf11393f4c0bf8565f867a5ced16012103505f0d82bbdd251511591b34f36ad5eea37d3220c2b81a1189084431ddb3aa3d',
                    commitment_data: commitmentData,
                },
                // # NOTE: FAKE input tx
                {
                    address_n: ADDRESS_N("m/84'/1'/0'/1/0"),
                    prev_hash: 'f982c0a283bd65a59aa89eded9e48f2a3319cb80361dfab4cf6192a03badb60a',
                    prev_index: 1,
                    amount: 7289000,
                    script_type: 'SPENDWITNESS',
                },
            ],
            outputs: [
                // Other's coinjoined output.
                {
                    address: 'tb1qk7j3ahs2v6hrv4v282cf0tvxh0vqq7rpt3zcml',
                    amount: 50000,
                    script_type: 'PAYTOADDRESS',
                    payment_req_index: 0,
                },
                // Our coinjoined output.
                {
                    // tb1qze76uzqteg6un6jfcryrxhwvfvjj58ts0swg3d
                    address_n: ADDRESS_N("m/84'/1'/0'/1/1"),
                    amount: 50000,
                    script_type: 'PAYTOWITNESS',
                    payment_req_index: 0,
                },
                // Our change output.
                {
                    // tb1qr5p6f5sk09sms57ket074vywfymuthlgud7xyx
                    address_n: ADDRESS_N("m/84'/1'/0'/1/2"),
                    amount: 7289000 - 50000 - 36445 - 490,
                    script_type: 'PAYTOWITNESS',
                    payment_req_index: 0,
                },
                // Other's change output.
                {
                    address: 'tb1q9cqhdr9ydetjzrct6tyeuccws9505hl96azwxk',
                    amount: 100000 - 50000 - 500 - 490,
                    script_type: 'PAYTOADDRESS',
                    payment_req_index: 0,
                },
                // Coordinator's output.
                {
                    address: 'mvbu1Gdy8SUjTenqerxUaZyYjmveZvt33q',
                    amount: 36945,
                    script_type: 'PAYTOADDRESS',
                    payment_req_index: 0,
                },
            ],
            paymentRequests: [
                {
                    recipient_name: 'www.example.com',
                    signature:
                        'af22d614a4920f54e7704c186bf12f24dbef475df31645574c9f9b4dbb3594c4d4084d8a16a6db0cda814377d58e564b872f02331a3db0bf229856aa33e8bc19',
                },
            ],
            refTxs: TX_CACHE(['e5b7e2', 'f982c0'], true), // Fake tx
            coin: 'testnet',
            preauthorized: true,
        };

        // ButtonRequests during signing is not emitted because of preauthorization

        const round1 = await TrezorConnect.signTransaction(params);
        expect(round1.payload).toMatchObject({
            serializedTx:
                '010000000001028abbd1cf69e00fbf60fa3ba475dccdbdba4a859ffa6bfd1ee820a75b1be2b7e50000000000ffffffff0ab6ad3ba09261cfb4fa1d3680cb19332a8fe4d9de9ea89aa565bd83a2c082f90100000000ffffffff0550c3000000000000160014b7a51ede0a66ae36558a3ab097ad86bbd800786150c3000000000000160014167dae080bca35c9ea49c0c8335dcc4b252a1d7011e56d00000000001600141d03a4d2167961b853d6cadfeab08e4937c5dfe872bf0000000000001600142e01768ca46e57210f0bd2c99e630e8168fa5fe551900000000000001976a914a579388225827d9f2fe9014add644487808c695d88ac000247304402204df07c5baacca264696cc4270665cb759be05387dead8942bd41f20309ceb29002203e685b8e9483435d9b70006bb424b5fef7249415a0f212abdf202b5d62859698012103505647c017ff2156eb6da20fae72173d3b681a1d0a629f95f49e884db300689f00000000',
        });

        // sign again ...
        const round2 = await TrezorConnect.signTransaction(params);
        expect(round2.success).toBe(true);

        // ... and again, fees should exceed maxRounds
        const round3 = await TrezorConnect.signTransaction(params);
        expect(round3.success).toBe(false);
        expect(round3.payload).toMatchObject({ error: 'Exceeded number of CoinJoin rounds.' });
    });
});
