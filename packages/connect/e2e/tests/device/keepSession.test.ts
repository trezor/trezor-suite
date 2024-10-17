import TrezorConnect, { StaticSessionId } from '../../../src';

import { getController, setup, conditionalTest, initTrezorConnect } from '../../common.setup';

const controller = getController();

describe('keepSession common param', () => {
    beforeAll(async () => {
        await TrezorConnect.dispose();
        await setup(controller, {
            mnemonic: 'mnemonic_all',
            passphrase_protection: true,
        });
        await initTrezorConnect(controller);
    });

    afterAll(async () => {
        controller.dispose();
        await TrezorConnect.dispose();
    });

    conditionalTest(['1', '<2.3.2'], 'keepSession with changing useCardanoDerivation', async () => {
        TrezorConnect.on('ui-request_passphrase', () => {
            TrezorConnect.uiResponse({ type: 'ui-receive_passphrase', payload: { value: 'a' } });
        });

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

        const { device } = enableDerivation;
        if (!device || !device.state) throw new Error('Device not found');

        // change device instance to simulate app reload
        // passphrase request should not be called
        TrezorConnect.removeAllListeners('ui-request_passphrase');
        // modify instance in staticSessionId
        const staticSessionId = device.state.staticSessionId?.replace(
            ':0',
            ':1',
        ) as StaticSessionId;
        const keepCardanoDerivation = await TrezorConnect.getAccountDescriptor({
            coin: 'ada',
            path: "m/1852'/1815'/0'/0/0",
            device: {
                // change instance to new but use already initialized state
                instance: 1,
                state: {
                    ...device.state,
                    staticSessionId,
                },
                path: device.path,
            },
            // useCardanoDerivation: true, // NOTE: not required, its in the state
        });
        if (!keepCardanoDerivation.success) throw new Error(keepCardanoDerivation.payload.error);
        expect(keepCardanoDerivation.payload.descriptor).toEqual(
            enableDerivation.payload.descriptor,
        );
    });
});
