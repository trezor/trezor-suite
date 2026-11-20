import { vi } from 'vitest';

import TrezorConnect, { UI_EVENTS } from '../../../src';
import { conditionalTest, getController, initTrezorConnect, setup } from '../../common.setup';

const controller = getController();

describe('TrezorConnect.resetDevice', () => {
    beforeEach(async () => {
        await setup(controller, { wiped: true });
        await initTrezorConnect(controller);
    });

    afterEach(() => {
        TrezorConnect.dispose();
    });

    afterAll(() => {
        controller.dispose();
    });

    it('resetDevice Bip39', async () => {
        const response = await TrezorConnect.resetDevice({
            skip_backup: true,
            backup_type: 0,
        });
        expect(response.success).toEqual(true);
    });

    conditionalTest(
        ['<1.13.1', '<2.8.7'],
        'resetDevice reports entropy check xpub hashes',
        async () => {
            const entropyCheckSpy = vi.fn();
            TrezorConnect.on(UI_EVENTS.WALLET_CREATION_ENTROPY_CHECK, entropyCheckSpy);

            const response = await TrezorConnect.resetDevice({
                skip_backup: true,
                backup_type: 0,
                entropy_check: true,
            });
            expect(response.success).toEqual(true);
            // xpubHashes are reported only via the event
            expect(response.success && response.payload).toEqual({ message: expect.any(String) });
            expect(entropyCheckSpy).toHaveBeenCalledTimes(1);
            expect(entropyCheckSpy).toHaveBeenCalledWith(
                expect.objectContaining({
                    xpubHashes: {
                        "m/84'/0'/0'": expect.any(String),
                        "m/44'/60'/0'": expect.any(String),
                    },
                }),
            );
        },
    );

    conditionalTest(['1', '<2.7.2'], 'resetDevice Slip39_Basic', async () => {
        const response = await TrezorConnect.resetDevice({
            skip_backup: true,
            backup_type: 1,
        });
        expect(response.success).toEqual(true);
    });

    conditionalTest(['1', '<2.7.2'], 'resetDevice Slip39_Basic_Extendable', async () => {
        const response = await TrezorConnect.resetDevice({
            skip_backup: true,
            backup_type: 4,
        });
        expect(response.success).toEqual(true);
    });

    conditionalTest(['1', '<2.7.2'], 'resetDevice Slip39_Advanced', async () => {
        const response = await TrezorConnect.resetDevice({
            skip_backup: true,
            backup_type: 2,
        });
        expect(response.success).toEqual(true);
    });

    conditionalTest(['1', '<2.7.2'], 'resetDevice Slip39_Advanced_Extendable', async () => {
        const response = await TrezorConnect.resetDevice({
            skip_backup: true,
            backup_type: 5,
        });
        expect(response.success).toEqual(true);
    });

    conditionalTest(['1', '<2.7.2'], 'resetDevice Slip39_Single_Extendable', async () => {
        const response = await TrezorConnect.resetDevice({
            skip_backup: true,
            backup_type: 3,
        });
        expect(response.success).toEqual(true);
    });
});
