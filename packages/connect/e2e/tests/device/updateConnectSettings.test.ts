// eslint-disable-next-line import/no-extraneous-dependencies
import TrezorConnect from '@trezor/connect';
// Deep import bypasses the `@trezor/transport` barrel so vitest's web project
// (which mocks `usb` via `transport/mocks/usb.cjs`) doesn't evaluate
// `NodeUsbTransport`'s `import { WebUSB } from 'usb'` — the cjs mock's named
// export interop is unreliable through Vite's browser resolver.
import { BridgeTransport } from '@trezor/transport/src/transports/bridge';

import { getController, initTrezorConnect, setup } from '../../common.setup';

const controller = getController();

describe('TrezorConnect.updateConnectSettings', () => {
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

    describe('transports — live reconfig', () => {
        it('reapplying transports keeps the connected device reachable (no reload)', async () => {
            const before = await TrezorConnect.getFeatures();
            expect(before.success).toBe(true);

            const reconfig = await TrezorConnect.updateConnectSettings({
                transports: [new BridgeTransport({ id: 'bridge', port: 21328 })],
            });
            expect(reconfig).toMatchObject({ success: true, payload: { message: 'success' } });

            const after = await TrezorConnect.getFeatures();
            expect(after.success).toBe(true);
            if (after.success && before.success) {
                expect(after.payload.device_id).toBe(before.payload.device_id);
            }
        });
    });
});
