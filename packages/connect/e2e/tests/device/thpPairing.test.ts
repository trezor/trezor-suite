import { getController, initTrezorConnect, setup } from '../../common.setup';
import TrezorConnect, { ConnectSettings, Device } from '../../../src';

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
            thp: {
                hostName: 'TrezorConnect',
                staticKeys: '0007070707070707070707070707070707070707070707070707070707070747',
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
                }
                resolve(device);
            };
            TrezorConnect.on('device-connect', onDeviceConnected);
            TrezorConnect.on('device-connect_unacquired', onDeviceConnected);
        });
    };

    it('ThpPairing NoMethod', async () => {
        await waitForDevice({ pairingMethods: ['NoMethod'] });

        const address = await TrezorConnect.getAddress({
            // device,
            path: "m/44'/0'/0'/1/1",
            showOnTrezor: true,
        });
        expect(address).toMatchObject({ success: true });
    });

    it('ThpPairing CodeEntry', async () => {
        const device = await waitForDevice({ pairingMethods: ['CodeEntry'] });

        TrezorConnect.on('ui-request_thp_pairing', async ({ device }) => {
            const state = await controller.getDebugState(device.protocolState.channel);
            TrezorConnect.removeAllListeners('ui-request_thp_pairing');
            TrezorConnect.uiResponse({
                type: 'ui-receive_thp_pairing_tag',
                payload: {
                    source: 'code-entry',
                    value: state.thp_pairing_code_entry_code.toString(),
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

    it('ThpPairing QrCode', async () => {
        const device = await waitForDevice({ pairingMethods: ['QrCode'] });

        TrezorConnect.on('ui-request_thp_pairing', async ({ device }) => {
            const state = await controller.getDebugState(device.protocolState.channel);
            TrezorConnect.removeAllListeners('ui-request_thp_pairing');
            TrezorConnect.uiResponse({
                type: 'ui-receive_thp_pairing_tag',
                payload: { source: 'qr-code', value: state.thp_pairing_code_qr_code },
            });
        });

        const address = await TrezorConnect.getAddress({
            device,
            path: "m/44'/0'/0'/1/1",
            // showOnTrezor: true,
        });
        expect(address).toMatchObject({ success: true });
    });

    it('ThpPairing NFC_Unidirectional', async () => {
        const device = await waitForDevice({ pairingMethods: ['NFC_Unidirectional'] });

        TrezorConnect.on('ui-request_thp_pairing', async ({ device }) => {
            // await new Promise(resolve => setTimeout(resolve, 1000));
            const state = await controller.getDebugState(device.protocolState.channel);
            TrezorConnect.removeAllListeners('ui-request_thp_pairing');
            TrezorConnect.uiResponse({
                type: 'ui-receive_thp_pairing_tag',
                payload: { source: 'nfc', value: state.thp_pairing_code_nfc_unidirectional },
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
        expect(device.type).toEqual('unreadable');
    });

    it('ThpPairing using known credentials', async () => {
        const device = await waitForDevice({
            pairingMethods: ['CodeEntry'],
            knownCredentials: [
                {
                    trezor_static_pubkey:
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
