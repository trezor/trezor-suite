import TrezorConnect, { ConnectSettings, Device } from '../../../src';
import { getController, initTrezorConnect, setup } from '../../common.setup';

describe('THP pairing', () => {
    const controller = getController();

    beforeAll(async () => {
        await setup(controller, { mnemonic: 'mnemonic_all' });
    });

    afterEach(() => {
        TrezorConnect.dispose();
    });

    const waitForDevice = async (settings: Partial<ConnectSettings['thp']>) => {
        await initTrezorConnect(controller, {
            debug: true,
            thp: {
                hostName: 'TrezorConnect tests:e2e',
                staticKey: '0007070707070707070707070707070707070707070707070707070707070747',
                knownCredentials: [],
                pairingMethods: [],
                ...settings,
            },
        });

        return new Promise<Device>((resolve, reject) => {
            const onDeviceConnected = (device: Device) => {
                TrezorConnect.removeAllListeners('device-connect');
                TrezorConnect.removeAllListeners('device-connect_unacquired');
                if (device.type === 'unreadable') {
                    reject(new Error('Device unreadable'));
                } else {
                    resolve(device);
                }
            };
            TrezorConnect.on('device-connect', onDeviceConnected);
            TrezorConnect.on('device-connect_unacquired', onDeviceConnected);
        });
    };

    it('ThpPairing SkipPairing', async () => {
        const spy = jest.fn();
        const device = await waitForDevice({ pairingMethods: ['SkipPairing'] });
        TrezorConnect.on('ui-request_thp_pairing', spy);

        const address = await TrezorConnect.getAddress({
            device,
            path: "m/44'/0'/0'/1/1",
            showOnTrezor: true,
        });
        expect(address).toMatchObject({ success: true });
        expect(spy).toHaveBeenCalledTimes(0);
    });

    it('ThpPairing CodeEntry', async () => {
        const device = await waitForDevice({ pairingMethods: ['CodeEntry'] });

        // eslint-disable-next-line @typescript-eslint/no-shadow
        TrezorConnect.on('ui-request_thp_pairing', async ({ device }) => {
            const state = await controller.getPairingInfo(device.thp!.channel);
            TrezorConnect.removeAllListeners('ui-request_thp_pairing');
            TrezorConnect.uiResponse({
                type: 'ui-receive_thp_pairing_tag',
                payload: {
                    source: 'code-entry',
                    tag: state.code_entry_code,
                },
            });
        });

        const address = await TrezorConnect.getAddress({
            device,
            path: "m/44'/0'/0'/1/1",
            // showOnTrezor: true,
        });
        expect(address).toMatchObject({ success: true });
    });

    // throws: not implemented
    it.skip('ThpPairing QrCode', async () => {
        const device = await waitForDevice({ pairingMethods: ['QrCode'] });

        // eslint-disable-next-line @typescript-eslint/no-shadow
        TrezorConnect.on('ui-request_thp_pairing', async ({ device }) => {
            const state = await controller.getPairingInfo(device.thp!.channel);
            TrezorConnect.removeAllListeners('ui-request_thp_pairing');
            TrezorConnect.uiResponse({
                type: 'ui-receive_thp_pairing_tag',
                payload: { source: 'qr-code', tag: state.code_qr_code },
            });
        });

        const address = await TrezorConnect.getAddress({
            device,
            path: "m/44'/0'/0'/1/1",
            // showOnTrezor: true,
        });
        expect(address).toMatchObject({ success: true });
    });

    it('ThpPairing NFC', async () => {
        const device = await waitForDevice({ pairingMethods: ['NFC'] });

        // eslint-disable-next-line @typescript-eslint/no-shadow
        TrezorConnect.on('ui-request_thp_pairing', async ({ device, nfcData }) => {
            // await new Promise(resolve => setTimeout(resolve, 1000));
            const state = await controller.getPairingInfo(device.thp!.channel, nfcData);
            TrezorConnect.removeAllListeners('ui-request_thp_pairing');
            TrezorConnect.uiResponse({
                type: 'ui-receive_thp_pairing_tag',
                payload: { source: 'nfc', tag: state.nfc_secret_trezor },
            });
        });

        const address = await TrezorConnect.getAddress({
            device,
            path: "m/44'/0'/0'/1/1",
            // showOnTrezor: true,
        });
        expect(address).toMatchObject({ success: true });
    });

    it('ThpPairing no matching method. device unreadable', async () => {
        const device = await waitForDevice({
            pairingMethods: ['FooBar', undefined, 1234, null, {}] as any,
        });

        // TODO: expect(device.type).toEqual('unreadable');
        expect(device.type).toEqual('unacquired');
    });

    it('ThpPairing using known credentials', async () => {
        const device = await waitForDevice({
            pairingMethods: ['CodeEntry'],
            knownCredentials: [
                {
                    trezor_static_public_key:
                        '38d6437ef1d67a4742265281de1e9a68df28774636f34b5e3e336d3ab90e671c',
                    credential:
                        '0a0f0a0d5472657a6f72436f6e6e6563741220f53793b13dffe2a4f01c2c7272aecc75b8596cf0fce4b09efd4fb353696a179b',
                },
            ],
        });

        const address = await TrezorConnect.getAddress({
            device,
            path: "m/44'/0'/0'/1/1",
            showOnTrezor: true,
        });
        expect(address).toMatchObject({ success: true });
    });
});
