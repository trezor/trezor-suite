// eslint-disable-next-line import/no-extraneous-dependencies
import TrezorConnect from '@trezor/connect';

import { conditionalTest, getController, initTrezorConnect, setup } from '../../common.setup';

describe('TrezorConnect.cancelCoinjoinAuthorization', () => {
    const controller = getController();

    beforeAll(async () => {
        await setup(controller, {
            mnemonic: 'mnemonic_all',
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

    conditionalTest(['1', '<2.5.4'], 'Cancel authorization works', async () => {
        const auth = await TrezorConnect.authorizeCoinjoin({
            coordinator: 'www.example.com',
            maxRounds: 2,
            maxCoordinatorFeeRate: 500000, // 5% => 0.005 * 10**8;
            maxFeePerKvbyte: 3500,
            path: "m/10025'/1'/0'/1'",
            coin: 'Testnet',
            scriptType: 'SPENDTAPROOT',
        });

        if (!auth.success) throw new Error(auth.error.message);
        expect(auth.payload).toEqual({ message: 'Coinjoin authorized' });

        const commitmentData =
            '0f7777772e6578616d706c652e636f6d0000000000000000000000000000000000000000000000000000000000000001';

        const proof = await TrezorConnect.getOwnershipProof({
            coin: 'Testnet',
            path: "m/10025'/1'/0'/1'/1/0",
            scriptType: 'SPENDTAPROOT',
            userConfirmation: true,
            commitmentData,
            preauthorized: true,
        });

        expect(proof.success).toBe(true);

        const cancelAuthResult = await TrezorConnect.cancelCoinjoinAuthorization({});
        if (!cancelAuthResult.success) throw new Error(cancelAuthResult.error.message);
        expect(cancelAuthResult.payload.message).toBe('Authorization cancelled');

        const proof2 = await TrezorConnect.getOwnershipProof({
            coin: 'Testnet',
            path: "m/10025'/1'/0'/1'/1/0",
            scriptType: 'SPENDTAPROOT',
            userConfirmation: true,
            commitmentData,
            preauthorized: true,
        });

        if (proof2.success) throw new Error('Expected failure but got success');
        expect(proof2.error.message).toBe('No preauthorized operation');
    });
});
