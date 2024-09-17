import TrezorConnect from '../../../src';

import { getController, setup, conditionalTest, initTrezorConnect } from '../../common.setup';

const controller = getController();

describe('keepSession common param', () => {
    beforeAll(async () => {
        await TrezorConnect.dispose();
        await setup(controller, {
            mnemonic: 'mnemonic_all',
        });
        await initTrezorConnect(controller);
    });

    afterAll(async () => {
        controller.dispose();
        await TrezorConnect.dispose();
    });

    conditionalTest(['1', '<2.3.2'], 'keepSession with changing useCardanoDerivation', async () => {
        const noDerivation = await TrezorConnect.getAccountDescriptor({
            coin: 'ada',
            path: "m/1852'/1815'/0'/0/0",
            useCardanoDerivation: false,
            keepSession: true,
        });
        if (noDerivation.success) throw new Error('noDerivation should not succeed');
        expect(noDerivation.payload.error).toBe(
            'Cardano derivation is not enabled for this session',
        );

        const enableDerivation = await TrezorConnect.getAccountDescriptor({
            coin: 'ada',
            path: "m/1852'/1815'/0'/0/0",
            useCardanoDerivation: true,
            keepSession: true,
        });
        if (!enableDerivation.success) throw new Error(enableDerivation.payload.error);
        expect(enableDerivation.payload.descriptor).toBeDefined();
    });
});
