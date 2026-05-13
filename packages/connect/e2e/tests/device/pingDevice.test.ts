import { vi } from 'vitest';

// eslint-disable-next-line import/no-extraneous-dependencies
import TrezorConnect from '@trezor/connect';

import { conditionalTest, getController, initTrezorConnect, setup } from '../../common.setup';

const controller = getController();

describe('TrezorConnect.pingDevice', () => {
    beforeAll(async () => {
        await setup(controller, {
            mnemonic: 'mnemonic_all',
        });
        await initTrezorConnect(controller, { debug: false });
    });

    afterAll(() => {
        controller.dispose();
        TrezorConnect.dispose();
    });

    it('short message', async () => {
        const message = 'Message from E2E test';
        const response = await TrezorConnect.pingDevice({
            message,
        });
        expect(response).toMatchObject({
            success: true,
            payload: {
                message,
            },
        });
    });

    conditionalTest(['1'], 'long message', async () => {
        // firmware _PROTOBUF_BUFFER_SIZE = const(8704)
        // left some space for the headers
        const response = await TrezorConnect.pingDevice({
            message: 'a'.repeat(8000),
        });
        expect(response.success).toEqual(true);
    });

    conditionalTest(['2'], 'long message T1B1', async () => {
        // firmware Ping.message max_size:256
        const response = await TrezorConnect.pingDevice({
            message: 'a'.repeat(255),
        });
        expect(response.success).toEqual(true);
    });

    it('with button request', async () => {
        const buttonSpy = vi.fn();
        TrezorConnect.on('ui-button', buttonSpy);

        const response = await TrezorConnect.pingDevice({
            button_protection: true,
        });
        expect(response.success).toEqual(true);
        expect(buttonSpy).toHaveBeenCalledTimes(1);
    });
});
