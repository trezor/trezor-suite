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
            pendingTransportEvent: false,
            thp: {
                appName: 'TrezorConnect',
                hostName: 'tests:e2e',
                staticKey: '0007070707070707070707070707070707070707070707070707070707070747',
                knownCredentials: [],
                pairingMethods: [],
                ...settings,
            },
        });

        return new Promise<Device>((resolve, reject) => {
            const onDeviceConnected = (device: Device) => {
                TrezorConnect.off('device-connect', onDeviceConnected);
                TrezorConnect.off('device-connect_unacquired', onDeviceConnected);
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
        const spy = typeof jest !== 'undefined' ? jest.fn() : jasmine.createSpy('on.button');
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
                    tag: state.code_entry_code.toString(),
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

    it('ThpPairing with credentials (autoconnect: false)', async () => {
        const device = await waitForDevice({
            pairingMethods: ['CodeEntry'],
            knownCredentials: [
                {
                    trezor_static_public_key:
                        'f60b84cdb80a2139f80489c811dc129937a4f4f75ca7710c7570c5085f1ffe68',
                    credential:
                        '0a1c0a0974657374733a65326510001a0d5472657a6f72436f6e6e656374122098822d64a482198c9654295ee690f7bf0e8ecf1aac50473b0e805c5614a3bef9',
                    autoconnect: false,
                },
            ],
        });

        const pairingSpy = typeof jest !== 'undefined' ? jest.fn() : jasmine.createSpy('pairing');
        TrezorConnect.on('ui-request_thp_pairing', pairingSpy);

        const address = await TrezorConnect.getAddress({
            device,
            path: "m/44'/0'/0'/1/1",
            showOnTrezor: true,
        });
        expect(address).toMatchObject({ success: true });
        expect(pairingSpy).toHaveBeenCalledTimes(0);
    });

    it('ThpPairing with credentials (autoconnect: true)', async () => {
        const device = await waitForDevice({ pairingMethods: ['CodeEntry'] });

        const credentialsSpy =
            typeof jest !== 'undefined' ? jest.fn() : jasmine.createSpy('credentials');
        TrezorConnect.on('device-thp_credentials_changed', credentialsSpy);

        TrezorConnect.on('ui-request_thp_pairing', async ({ nfcData }) => {
            const state = await controller.getPairingInfo(device.thp!.channel, nfcData);
            TrezorConnect.uiResponse({
                type: 'ui-receive_thp_pairing_tag',
                payload: { source: 'code-entry', tag: state.code_entry_code },
            });
        });

        // start pairing
        await TrezorConnect.getFeatures({ device });
        // autoconnect: false credentials obtained
        expect(credentialsSpy).toHaveBeenCalledTimes(1);

        // generate autoconnect credentials
        await TrezorConnect.thpGetCredentials({ device });
        // autoconnect: true credentials obtained
        expect(credentialsSpy).toHaveBeenCalledTimes(2);

        // expect no pairing or button request from now on
        TrezorConnect.removeAllListeners('ui-request_thp_pairing');
        TrezorConnect.removeAllListeners('ui-button');

        // restart the device
        await controller.stopEmu();
        await new Promise<void>(resolve => {
            const onDeviceDisconnected = () => {
                TrezorConnect.off('device-disconnect', onDeviceDisconnected);
                resolve();
            };
            TrezorConnect.on('device-disconnect', onDeviceDisconnected);
        });
        await controller.startEmu({
            model: 'T3W1',
            version: '2-main',
        });
        await new Promise<void>(resolve => {
            const onDeviceConnected = () => {
                TrezorConnect.off('device-connect', onDeviceConnected);
                resolve();
            };
            TrezorConnect.on('device-connect', onDeviceConnected);
        });

        const address = await TrezorConnect.getAddress({
            device,
            path: "m/44'/0'/0'/1/1",
            showOnTrezor: false,
        });
        expect(address).toMatchObject({ success: true });
    });

    it('ThpPairing cancelled', async () => {
        const device = await waitForDevice({
            pairingMethods: ['CodeEntry'],
            knownCredentials: [],
        });

        const ERR = new Error('Unexpected success');
        let result;

        // 1. reject pairing tag request from host
        TrezorConnect.on('ui-request_thp_pairing', () => {
            TrezorConnect.cancel('Custom cancel');
        });
        result = await TrezorConnect.getFeatures({ device });
        if (result.success) throw ERR;
        expect(result.payload.error).toMatch('Custom cancel');

        // 2. reject pairing tag request from Trezor
        TrezorConnect.removeAllListeners('ui-request_thp_pairing');
        TrezorConnect.on('ui-request_thp_pairing', () => {
            controller.send({ type: 'emulator-press-no' });
        });
        result = await TrezorConnect.getFeatures({ device });
        if (result.success) throw ERR;
        expect(result.payload.error).toMatch('Cancelled');

        // 3. reject pairing confirmation from Trezor
        TrezorConnect.removeAllListeners('ui-button');
        TrezorConnect.on('ui-button', () => {
            controller.send({ type: 'emulator-press-no' });
        });
        result = await TrezorConnect.getFeatures({ device });
        if (result.success) throw ERR;
        expect(result.payload.error).toMatch('Cancelled');

        // 3. reject pairing confirmation from host
        TrezorConnect.removeAllListeners('ui-button');
        TrezorConnect.on('ui-button', () => {
            TrezorConnect.cancel('Custom canceled');
        });
        result = await TrezorConnect.getFeatures({ device });
        if (result.success) throw ERR;
        expect(result.payload.error).toMatch('Custom canceled');

        // check if pairing is still responsive
        TrezorConnect.removeAllListeners('ui-button');
        TrezorConnect.removeAllListeners('ui-request_thp_pairing');
        TrezorConnect.on('ui-button', () => {
            controller.send({ type: 'emulator-press-yes' });
        });
        TrezorConnect.on('ui-request_thp_pairing', async ({ nfcData, ...rest }) => {
            const state = await controller.getPairingInfo(rest.device.thp!.channel, nfcData);
            TrezorConnect.uiResponse({
                type: 'ui-receive_thp_pairing_tag',
                payload: { source: 'code-entry', tag: state.code_entry_code },
            });
        });
        result = await TrezorConnect.getFeatures({ device });
        expect(result).toMatchObject({ success: true });

        // 4. reject ButtonRequest from host
        TrezorConnect.removeAllListeners('ui-button');
        TrezorConnect.on('ui-button', () => {
            TrezorConnect.cancel('Custom canceled');
        });
        result = await TrezorConnect.getAddress({
            device,
            path: "m/44'/0'/0'/1/1",
            showOnTrezor: true,
        });
        if (result.success) throw ERR;
        expect(result.payload.error).toMatch('Custom canceled');

        // 4. reject ButtonRequest from Trezor
        TrezorConnect.removeAllListeners('ui-button');
        TrezorConnect.on('ui-button', () => {
            controller.send({ type: 'emulator-press-no' });
        });
        result = await TrezorConnect.getAddress({
            device,
            path: "m/44'/0'/0'/1/1",
            showOnTrezor: true,
        });
        if (result.success) throw ERR;
        expect(result.payload.error).toMatch('Cancelled');

        // and finally check if device is still responsive
        TrezorConnect.removeAllListeners('ui-button');
        TrezorConnect.on('ui-button', () => {
            controller.send({ type: 'emulator-press-yes' });
        });
        result = await TrezorConnect.getAddress({
            device,
            path: "m/44'/0'/0'/1/1",
            showOnTrezor: true,
        });
        expect(result).toMatchObject({ success: true });
    });
});
