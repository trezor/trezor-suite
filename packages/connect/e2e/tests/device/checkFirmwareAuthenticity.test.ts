import TrezorConnect from '../../../src';

const { getController, setup, initTrezorConnect } = global.Trezor;

const controller = getController();

describe('TrezorConnect.checkFirmwareAuthenticity', () => {
    beforeAll(async () => {
        await setup(controller, {
            mnemonic: 'mnemonic_all',
        });
        await initTrezorConnect(controller);
    });

    afterAll(async () => {
        controller.dispose();
        await TrezorConnect.dispose();
    });

    it('sometimes valid sometimes not, depends on circumstances', async () => {
        const result = await TrezorConnect.checkFirmwareAuthenticity({});

        if (result.success) {
            // when running with emulator, hashes will never match.
            expect(typeof result.payload.valid).toEqual('boolean');
            expect(typeof result.payload.expectedFirmwareHash).toEqual('string');
            expect(typeof result.payload.actualFirmwareHash).toEqual('string');
        }
    });
});
