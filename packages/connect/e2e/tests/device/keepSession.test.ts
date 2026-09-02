import TrezorConnect, { type StaticSessionId, UI_REQUESTS, UI_RESPONSE } from '../../../src';
import { conditionalTest, getController, initTrezorConnect, setup } from '../../common.setup';

const controller = getController();

describe('keepSession common param', () => {
    beforeAll(async () => {
        TrezorConnect.dispose();
        await setup(controller, {
            mnemonic: 'mnemonic_all',
            passphrase_protection: true,
        });
        await initTrezorConnect(controller);
    });

    afterAll(() => {
        controller.dispose();
        TrezorConnect.dispose();
    });

    conditionalTest(['1', '<2.3.2'], 'keepSession preserves Cardano derivation', async () => {
        TrezorConnect.on(UI_REQUESTS.REQUEST_PASSPHRASE, () => {
            TrezorConnect.uiResponse({
                type: UI_RESPONSE.RECEIVE_PASSPHRASE,
                payload: { value: 'a' },
            });
        });

        // Enable 'ada'. The call forces a session re-create with derive_cardano.
        await TrezorConnect.updateConnectSettings({ enabledNetworks: [{ coin: 'ada' }] });
        const enableDerivation = await TrezorConnect.cardanoGetPublicKey({
            path: "m/1852'/1815'/0'/0/0",
            keepSession: true,
        });
        if (!enableDerivation.success) throw new Error(enableDerivation.error.message);
        expect(enableDerivation.payload.publicKey).toBeDefined();

        const { device } = enableDerivation;
        if (!device || !device.state) throw new Error('Device not found');

        // change device instance to simulate app reload
        // passphrase request should not be called
        TrezorConnect.removeAllListeners(UI_REQUESTS.REQUEST_PASSPHRASE);
        // modify instance in staticSessionId
        const staticSessionId = device.state.staticSessionId?.replace(
            ':0',
            ':1',
        ) as StaticSessionId;
        const keepCardanoDerivation = await TrezorConnect.cardanoGetPublicKey({
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
            // 'ada' stays in the runtime set; derive_cardano is preserved in the session.
        });
        if (!keepCardanoDerivation.success) throw new Error(keepCardanoDerivation.error.message);
        expect(keepCardanoDerivation.payload.publicKey).toEqual(enableDerivation.payload.publicKey);
    });
});
