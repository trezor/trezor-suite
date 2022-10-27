import TrezorConnect from '@trezor/connect';

const { getController, setup, conditionalTest, initTrezorConnect } = global.Trezor;
const { ADDRESS_N } = global.TestUtils;

const controller = getController('applyFlags');

describe('TrezorConnect.authorizeCoinJoin', () => {
    beforeAll(async () => {
        await setup(controller, {
            mnemonic: 'mnemonic_all',
            settings: {
                experimental_features: true,
            },
        });
    });

    beforeEach(async () => {
        // restart connect for each test (working with event listeners)
        TrezorConnect.dispose();
        await initTrezorConnect(controller, { debug: false });
    });

    afterAll(() => {
        controller.dispose();
        TrezorConnect.dispose();
    });

    conditionalTest(['1', '<2.5.3'], 'Coinjoin success', async () => {
        // unlocked path is required for tx validation
        const unlockPath = await TrezorConnect.unlockPath({
            path: ADDRESS_N("m/10025'"),
        });
        if (!unlockPath.success) throw new Error(unlockPath.payload.error);

        const auth = await TrezorConnect.authorizeCoinJoin({
            coordinator: 'www.example.com',
            maxRounds: 2,
            maxCoordinatorFeeRate: 50000000, // 0.5 %
            maxFeePerKvbyte: 3500,
            path: ADDRESS_N("m/10025'/1'/0'/1'"),
            coin: 'Testnet',
            scriptType: 'SPENDTAPROOT',
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
            path: ADDRESS_N("m/10025'/1'/0'/1'/1/0"),
            scriptType: 'SPENDTAPROOT',
            userConfirmation: true, // ButtonRequest is not emitted because of preauthorization
            commitmentData,
            preauthorized: true,
        });

        expect(proof.success).toBe(true);

        const params: Parameters<typeof TrezorConnect.signTransaction>[0] = {
            inputs: [
                {
                    // seed "alcohol woman abuse must during monitor noble actual mixed trade anger aisle"
                    // m/10025'/1'/0'/1'/0/0
                    // tb1pkw382r3plt8vx6e22mtkejnqrxl4z7jugh3w4rjmfmgezzg0xqpsdaww8z
                    amount: 100000,
                    prev_hash: 'e5b7e21b5ba720e81efd6bfa9f854ababdcddc75a43bfa60bf0fe069cfd1bb8a',
                    prev_index: 0,
                    script_type: 'EXTERNAL',
                    script_pubkey:
                        '5120b3a2750e21facec36b2a56d76cca6019bf517a5c45e2ea8e5b4ed191090f3003',
                    ownership_proof:
                        '534c001901019cf1b0ad730100bd7a69e987d55348bb798e2b2096a6a5713e9517655bd2021300014052d479f48d34f1ca6872d4571413660040c3e98841ab23a2c5c1f37399b71bfa6f56364b79717ee90552076a872da68129694e1b4fb0e0651373dcf56db123c5',
                    commitment_data: commitmentData,
                },
                // # NOTE: FAKE input tx
                {
                    address_n: ADDRESS_N("m/10025'/1'/0'/1'/1/0"),
                    prev_hash: 'f982c0a283bd65a59aa89eded9e48f2a3319cb80361dfab4cf6192a03badb60a',
                    prev_index: 1,
                    amount: 7289000,
                    script_type: 'SPENDTAPROOT',
                },
            ],
            outputs: [
                // Other's coinjoined output.
                {
                    address: 'tb1pupzczx9cpgyqgtvycncr2mvxscl790luqd8g88qkdt2w3kn7ymhsrdueu2',
                    amount: 50000,
                    script_type: 'PAYTOADDRESS',
                    payment_req_index: 0,
                },
                // Our coinjoined output.
                {
                    // tb1phkcspf88hge86djxgtwx2wu7ddghsw77d6sd7txtcxncu0xpx22shcydyf
                    address_n: ADDRESS_N("m/10025'/1'/0'/1'/1/1"),
                    amount: 50000,
                    script_type: 'PAYTOTAPROOT',
                    payment_req_index: 0,
                },
                // Our change output.
                {
                    // tb1qr5p6f5sk09sms57ket074vywfymuthlgud7xyx
                    address_n: ADDRESS_N("m/10025'/1'/0'/1'/1/2"),
                    amount: 7289000 - 50000 - 36445 - 490,
                    script_type: 'PAYTOTAPROOT',
                    payment_req_index: 0,
                },
                // Other's change output.
                {
                    address: 'tb1pvt7lzserh8xd5m6mq0zu9s5wxkpe5wgf5ts56v44jhrr6578hz8saxup5m',
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
                    amount: 135955,
                    signature:
                        '07a0b1e1b44d75832bc26ce2c105fe5db35e64d802462ec7b7fc6283214efa743500c60420ae4952d9d41f0be4185816d4dedfabbe699ea2ddc253f9a40ba83c',
                },
            ],
            coin: 'testnet',
            preauthorized: true,
            unlockPath: unlockPath.payload, // NOTE: unlock path is required for validation, it will be removed in future
            serialize: false,
        };

        // ButtonRequests during signing is not emitted because of preauthorization

        const round1 = await TrezorConnect.signTransaction(params);
        expect(round1.payload).toMatchObject({
            signatures: [
                undefined,
                'c017fce789fa8db54a2ae032012d2dd6d7c76cc1c1a6f00e29b86acbf93022da8aa559009a574792c7b09b2535d288d6e03c6ed169902ed8c4c97626a83fbc11',
            ],
            serializedTx: '',
        });

        // sign again ...
        const round2 = await TrezorConnect.signTransaction(params);
        expect(round2.success).toBe(true);

        // ... and again, fees should exceed maxRounds
        const round3 = await TrezorConnect.signTransaction(params);
        expect(round3.success).toBe(false);
        expect(round3.payload).toMatchObject({ error: 'Exceeded number of CoinJoin rounds.' });
    });

    conditionalTest(['1', '<2.5.3'], 'Authorize and re-authorize', async () => {
        // setup two wallets, 1 with and 1 without passphrase
        await TrezorConnect.applySettings({ use_passphrase: true });
        const walletDefault = await TrezorConnect.getDeviceState({
            device: {
                instance: 0,
                state: undefined, // reset state from previous tests on this instance
            },
            useEmptyPassphrase: true,
        });

        TrezorConnect.on('ui-request_passphrase', () => {
            TrezorConnect.uiResponse({
                type: 'ui-receive_passphrase',
                payload: {
                    passphraseOnDevice: false,
                    value: 'a',
                },
            });
        });
        const walletA = await TrezorConnect.getDeviceState({
            device: {
                instance: 1,
                state: undefined, // reset state from previous tests on this instance
            },
        });
        if (!walletDefault.success || !walletA.success) {
            throw new Error(`Wallet state exception`);
        }

        // use same params in each call
        const params = {
            coordinator: 'www.example.com',
            maxRounds: 2,
            maxCoordinatorFeeRate: 50000000, // 0.5 %
            maxFeePerKvbyte: 3500,
            path: ADDRESS_N("m/10025'/1'/0'/1'"),
            coin: 'Testnet',
            scriptType: 'SPENDTAPROOT',
        } as const;

        // watch for button requests
        const spy = jest.fn();
        TrezorConnect.on('button', spy);

        // authorize no passphrase wallet
        await TrezorConnect.authorizeCoinJoin({
            ...params,
            device: { instance: 0, state: walletDefault.payload.state },
            useEmptyPassphrase: true,
        });

        expect(spy).toBeCalledTimes(2);

        // re-authorize
        await TrezorConnect.authorizeCoinJoin({
            ...params,
            device: { instance: 0, state: walletDefault.payload.state },
            useEmptyPassphrase: true,
            preauthorized: true,
        });

        expect(spy).toBeCalledTimes(2); // no more button requests

        // authorize passphrase wallet
        await TrezorConnect.authorizeCoinJoin({
            ...params,
            device: { instance: 1, state: walletA.payload.state },
        });

        expect(spy).toBeCalledTimes(4);

        // re-authorize passphrase wallet
        await TrezorConnect.authorizeCoinJoin({
            ...params,
            device: { instance: 1, state: walletA.payload.state },
            preauthorized: true,
        });

        // re-authorize no passphrase wallet again
        await TrezorConnect.authorizeCoinJoin({
            ...params,
            device: { instance: 0, state: walletDefault.payload.state },
            useEmptyPassphrase: true,
            preauthorized: true,
        });

        // re-authorize passphrase wallet again
        await TrezorConnect.authorizeCoinJoin({
            ...params,
            device: { instance: 1, state: walletA.payload.state },
            preauthorized: true,
        });

        expect(spy).toBeCalledTimes(4); // no more button requests

        // disable passphrase for future tests
        await TrezorConnect.applySettings({ use_passphrase: false });
    });
});
