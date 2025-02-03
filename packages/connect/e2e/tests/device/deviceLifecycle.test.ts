import TrezorConnect from '../../../src';
import { getController, initTrezorConnect, setup } from '../../common.setup';

const controller = getController();

describe('TrezorConnect device lifecycle tests', () => {
    beforeAll(async () => {
        await controller.connect();
    });
    afterAll(() => {
        controller.dispose();
        TrezorConnect.dispose();
    });

    it('TrezorConnect.init -> call', async () => {
        TrezorConnect.dispose();
        TrezorConnect.removeAllListeners();
        await controller.stopEmu();
        await controller.startBridge();
        await initTrezorConnect(controller, { autoConfirm: false });

        const firstDeviceEventSpy = jest.fn();
        TrezorConnect.on('device-connect', firstDeviceEventSpy);
        const selectDeviceEventPromise = new Promise(resolve => {
            TrezorConnect.on('ui-select_device', resolve);
        });

        TrezorConnect.getAddress({
            path: "m/44'/1'/0'/0/0",
            showOnTrezor: false,
        });

        expect(await selectDeviceEventPromise).toMatchObject({ webusb: false, devices: [] });
        expect(firstDeviceEventSpy).toHaveBeenCalledTimes(0);
    });

    [1, 100, 1000].forEach(delay => {
        it(`TrezorConnect.init -> startEmu -> wait ${delay}ms -> stopEmu -> startEmu -> device-connect event`, async () => {
            TrezorConnect.dispose();
            TrezorConnect.removeAllListeners();
            await setup(controller, {
                mnemonic: 'mnemonic_all',
            });
            await controller.stopEmu();
            await initTrezorConnect(controller, { autoConfirm: false });

            const deviceConnectEventPromise = new Promise(resolve => {
                TrezorConnect.on('device-connect', resolve);
            });

            await controller.startEmu();

            // testing disconnecting device during the initial reading of the device
            await new Promise(resolve => setTimeout(resolve, delay));
            await controller.stopEmu();
            await controller.startEmu();

            await deviceConnectEventPromise;
        });
    });

    it('TrezorConnect.init -> start emu -> device-connect event -> call', async () => {
        TrezorConnect.dispose();
        TrezorConnect.removeAllListeners();
        await setup(controller, {
            mnemonic: 'mnemonic_all',
        });
        await controller.stopEmu();
        await initTrezorConnect(controller, { autoConfirm: false });

        const deviceConnectEventPromise = new Promise(resolve => {
            TrezorConnect.on('device-connect', resolve);
        });

        await controller.startEmu();
        await deviceConnectEventPromise;

        const response = await TrezorConnect.getAddress({
            path: "m/44'/1'/0'/0/0",
            showOnTrezor: false,
        });
        expect(response.success).toBe(true);
    });
});
