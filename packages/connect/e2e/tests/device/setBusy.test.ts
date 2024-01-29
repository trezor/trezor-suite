/* eslint-disable import/no-named-as-default */

import TrezorConnect from '../../../src';

const { getController, setup, conditionalTest, initTrezorConnect } = global.Trezor;

const controller = getController('setBusy');

describe('TrezorConnect.setBusy', () => {
    beforeAll(async () => {
        await setup(controller, {
            mnemonic: 'mnemonic_all',
            pin: '1234',
            settings: {
                auto_lock_delay_ms: 10000,
            },
        });
        await initTrezorConnect(controller);
    });

    afterAll(async () => {
        controller.dispose();
        await TrezorConnect.dispose();
    });

    conditionalTest(['1', '<2.5.3'], 'setBusy timeout', async () => {
        let busy = false;
        TrezorConnect.on('DEVICE_EVENT', event => {
            if ('features' in event.payload) {
                busy = event.payload.features!.busy!;
            }
        });
        const setBusy = await TrezorConnect.setBusy({
            expiry_ms: 3000,
            keepSession: true, // keep session
        });
        if (!setBusy.success) throw new Error(setBusy.payload.error);

        expect(busy).toBe(true);

        // wait for expiry
        await new Promise(resolve => {
            setTimeout(resolve, 3000);
        });

        const features = await TrezorConnect.getFeatures();
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

    conditionalTest(['1', '<2.5.3'], 'setBusy with autolock', async () => {
        await new Promise(resolve => {
            setTimeout(resolve, 11000);
        }); // wait for auto-lock

        let busy = false;
        TrezorConnect.on('DEVICE_EVENT', event => {
            if ('features' in event.payload) {
                busy = event.payload.features!.busy!;
            }
        });

        const setBusy = await TrezorConnect.setBusy({
            expiry_ms: 15000,
            keepSession: true, // keep session
        });
        if (!setBusy.success) throw new Error(setBusy.payload.error);

        expect(busy).toBe(true);

        await new Promise(resolve => {
            setTimeout(resolve, 1000);
        }); // cool off

        // reset expiry
        await TrezorConnect.setBusy({});

        expect(busy).toBe(false);
    });
});
