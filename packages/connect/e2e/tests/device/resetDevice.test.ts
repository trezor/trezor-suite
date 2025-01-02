import TrezorConnect from '../../../src';
import { getController, setup, initTrezorConnect } from '../../common.setup';

const controller = getController();

describe('TrezorConnect.resetDevice', () => {
    beforeAll(async () => {
        await initTrezorConnect(controller);
    });

    beforeEach(async () => {
        await setup(controller, {
            wiped: true,
        });
    });

    afterAll(() => {
        controller.dispose();
        TrezorConnect.dispose();
    });

    it('resetDevice Bip39', async () => {
        const response = await TrezorConnect.resetDevice({
            skip_backup: true,
            backup_type: 0,
        });
        expect(response.success).toEqual(true);
    });

    it('resetDevice Slip39_Basic', async () => {
        const response = await TrezorConnect.resetDevice({
            skip_backup: true,
            backup_type: 1,
        });
        expect(response.success).toEqual(true);
    });

    it('resetDevice Slip39_Basic_Extendable', async () => {
        const response = await TrezorConnect.resetDevice({
            skip_backup: true,
            backup_type: 4,
        });
        expect(response.success).toEqual(true);
    });

    it('resetDevice Slip39_Advanced', async () => {
        const response = await TrezorConnect.resetDevice({
            skip_backup: true,
            backup_type: 2,
        });
        expect(response.success).toEqual(true);
    });

    it('resetDevice Slip39_Advanced_Extendable', async () => {
        const response = await TrezorConnect.resetDevice({
            skip_backup: true,
            backup_type: 5,
        });
        expect(response.success).toEqual(true);
    });

    it('resetDevice Slip39_Single_Extendable', async () => {
        const response = await TrezorConnect.resetDevice({
            skip_backup: true,
            backup_type: 3,
        });
        expect(response.success).toEqual(true);
    });
});
