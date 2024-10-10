import { getController, initTrezorConnect, setup } from '../../common.setup';
import TrezorConnect, { ConnectSettings } from '../../../src';

describe('THP pairing', () => {
    const controller = getController();

    beforeAll(async () => {
        await setup(controller, {
            mnemonic: 'mnemonic_all',
            // passphrase_protection: true,
        });
        await controller.stopBridge();
    });

    afterEach(() => {
        TrezorConnect.dispose();
    });

    const setupMe = async (settings: Partial<ConnectSettings['thp']>) => {
        await initTrezorConnect(controller, {
            transports: ['UdpTransport'],
            debug: true,
            thp: {
                hostName: 'TrezorConnect',
                staticKeys: '0007070707070707070707070707070707070707070707070707070707070747',
                knownCredentials: [],
                pairingMethods: [],
                ...settings,
            },
        });

        return new Promise<any>(resolve => {
            TrezorConnect.on('device-connect_unacquired', d => {
                resolve(d);
            });
        });
    };

    it('ThpPairing NoMethod', async () => {
        await initTrezorConnect(controller, {
            transports: ['UdpTransport'],
            debug: true,
            thp: {
                hostName: 'TrezorConnect',
                staticKeys: '0007070707070707070707070707070707070707070707070707070707070747',
                knownCredentials: [],
                pairingMethods: ['NoMethod'],
            },
        });

        const r = await TrezorConnect.getAddress({
            // device,
            path: "m/44'/0'/0'/1/1",
            showOnTrezor: true,
        });
        console.warn('R', r);
    });

    it('ThpPairing CodeEntry', async () => {
        await initTrezorConnect(controller, {
            transports: ['UdpTransport'],
            debug: true,
            thp: {
                hostName: 'TrezorConnect',
                staticKeys: '0007070707070707070707070707070707070707070707070707070707070747',
                knownCredentials: [],
                pairingMethods: ['CodeEntry'],
            },
        });

        const device = await new Promise<any>(resolve => {
            TrezorConnect.on('device-connect_unacquired', d => {
                resolve(d);
            });
        });

        TrezorConnect.on('ui-request_thp_pairing', async ({ device }) => {
            console.warn('EVT', device);
            const state = await controller.getDebugState(device.protocolState.channel);
            console.warn('State', state);
            TrezorConnect.uiResponse({
                type: 'ui-receive_thp_pairing_tag',
                payload: {
                    source: 'code-entry',
                    value: state.thp_pairing_code_entry_code.toString(),
                },
            });
        });

        // TrezorConnect.on('ui-request_passphrase', () => {
        //     TrezorConnect.uiResponse({
        //         type: 'ui-receive_passphrase',
        //         payload: { value: 'aaa' },
        //     });
        // });

        const r = await TrezorConnect.getAddress({
            device,
            path: "m/44'/0'/0'/1/1",
            showOnTrezor: true,
        });
        console.warn('R', r);
    });

    it('ThpPairing QrCode', async () => {
        const device = await setupMe({ pairingMethods: ['QrCode'] });

        TrezorConnect.on('ui-request_thp_pairing', async ({ device }) => {
            console.warn('EVT', device);
            const state = await controller.getDebugState(device.protocolState.channel);
            console.warn('State', state);
            TrezorConnect.uiResponse({
                type: 'ui-receive_thp_pairing_tag',
                payload: { source: 'qr-code', value: state.thp_pairing_code_qr_code },
            });
        });

        const r = await TrezorConnect.getAddress({
            device,
            path: "m/44'/0'/0'/1/1",
            showOnTrezor: true,
        });
        console.warn('R', r);
    });

    it('ThpPairing NFC_Unidirectional', async () => {
        const device = await setupMe({ pairingMethods: ['NFC_Unidirectional'] });

        TrezorConnect.on('ui-request_thp_pairing', async ({ device }) => {
            const state = await controller.getDebugState(device.protocolState.channel);
            TrezorConnect.uiResponse({
                type: 'ui-receive_thp_pairing_tag',
                payload: { source: 'nfc', value: state.thp_pairing_code_nfc_unidirectional },
            });
        });

        const r = await TrezorConnect.getAddress({
            device,
            path: "m/44'/0'/0'/1/1",
            showOnTrezor: true,
        });
        console.warn('R', r);
    });

    it('ThpPairing no matching method. device unreadable', async () => {
        const device = await setupMe({ pairingMethods: ['FooBar', undefined] as any });
        expect(device.type).toEqual('unreadable');
    });

    // flaky ?
    it.skip('ThpPairing using known credentials', async () => {
        const device = await setupMe({
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

        const r = await TrezorConnect.getAddress({
            device,
            path: "m/44'/0'/0'/1/1",
            showOnTrezor: true,
        });
        console.warn('R', r);
    });
});
