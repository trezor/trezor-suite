import TrezorConnect from '@trezor/connect';

const { getController, setup, conditionalTest, initTrezorConnect } = global.Trezor;

const controller = getController('setBusy');

describe('TrezorConnect.setBusy', () => {
    beforeAll(async () => {
        await setup(controller, {
            mnemonic: 'mnemonic_all',
        });
        await initTrezorConnect(controller);
    });

    afterAll(() => {
        controller.dispose();
        TrezorConnect.dispose();
    });

    conditionalTest(['1', '<2.5.3'], 'setBusy timeout', async () => {
        const busy = await TrezorConnect.setBusy({
            expiry_ms: 5000,
        });
        if (!busy.success) throw new Error(busy.payload.error);

        let features: Awaited<ReturnType<typeof TrezorConnect.getFeatures>>;

        features = await TrezorConnect.getFeatures();
        if (!features.success) throw new Error(features.payload.error);
        // is busy
        expect(features.payload.busy).toBe(true);

        // wait for expiry
        await new Promise(resolve => setTimeout(resolve, 5000));

        features = await TrezorConnect.getFeatures();
        if (!features.success) throw new Error(features.payload.error);
        expect(features.payload.busy).toBe(false);
    });

    conditionalTest(['1', '<2.5.3'], 'setBusy interruption', async () => {
        const busy = await TrezorConnect.setBusy({
            expiry_ms: 5000,
        });
        if (!busy.success) throw new Error(busy.payload.error);

        let features: Awaited<ReturnType<typeof TrezorConnect.getFeatures>>;

        features = await TrezorConnect.getFeatures();
        if (!features.success) throw new Error(features.payload.error);
        expect(features.payload.busy).toBe(true);

        // reset expiry
        await TrezorConnect.setBusy({});

        features = await TrezorConnect.getFeatures();
        if (!features.success) throw new Error(features.payload.error);
        // not busy
        expect(features.payload.busy).toBe(false);
    });
});
