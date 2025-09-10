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

    const ERR = new Error('Unexpected success');
    const CANCEL_ERR = 'Custom cancel';
    const FW_CANCEL_ERR = 'Cancelled';
    const cancelOnHost = async () => {
        // events are emitted before ButtonAck is sent to device
        await new Promise(resolve => setTimeout(resolve, 10));
        TrezorConnect.cancel(CANCEL_ERR);
    };
    const buttonRequestHandler = (msg?: string) => (br: { name?: string }) => {
        if (msg && msg === br.name) {
            controller.send({ type: 'emulator-press-no' });
        } else {
            controller.send({ type: 'emulator-press-yes' });
        }
    };

    it('ThpPairing cancel workflow', async () => {
        const device = await waitForDevice({
            pairingMethods: ['CodeEntry'],
            knownCredentials: [],
        });

        let result;

        // 1. reject pairing tag request from host
        TrezorConnect.on('ui-request_thp_pairing', cancelOnHost);
        result = await TrezorConnect.getFeatures({ device });
        if (result.success) throw ERR;
        expect(result.payload.error).toMatch(CANCEL_ERR);

        // 2. reject pairing tag request from Trezor
        TrezorConnect.removeAllListeners('ui-request_thp_pairing');
        TrezorConnect.on('ui-request_thp_pairing', () => {
            controller.send({ type: 'emulator-press-no' });
        });
        result = await TrezorConnect.getFeatures({ device });
        if (result.success) throw ERR;
        expect(result.payload.error).toMatch(FW_CANCEL_ERR);

        // 3. reject pairing confirmation from Trezor
        TrezorConnect.removeAllListeners('ui-button');
        TrezorConnect.on('ui-button', () => {
            controller.send({ type: 'emulator-press-no' });
        });
        result = await TrezorConnect.getFeatures({ device });
        if (result.success) throw ERR;
        expect(result.payload.error).toMatch(FW_CANCEL_ERR);

        // 3. reject pairing confirmation from host
        TrezorConnect.removeAllListeners('ui-button');
        TrezorConnect.on('ui-button', cancelOnHost);
        result = await TrezorConnect.getFeatures({ device });
        if (result.success) throw ERR;
        expect(result.payload.error).toMatch(FW_CANCEL_ERR); // canceled gracefully on Trezor

        // check if pairing is still responsive
        TrezorConnect.removeAllListeners('ui-button');
        TrezorConnect.removeAllListeners('ui-request_thp_pairing');
        TrezorConnect.on('ui-button', buttonRequestHandler());
        TrezorConnect.on('ui-request_thp_pairing', async ({ nfcData, ...rest }) => {
            const state = await controller.getPairingInfo(rest.device.thp!.channel, nfcData);
            TrezorConnect.uiResponse({
                type: 'ui-receive_thp_pairing_tag',
                payload: { source: 'code-entry', tag: state.code_entry_code },
            });
        });
        result = await TrezorConnect.getFeatures({ device });
        expect(result).toMatchObject({ success: true });
    });

    it('ThpState cancel workflow', async () => {
        // enable passphrase
        await setup(controller, { mnemonic: 'mnemonic_all', passphrase_protection: true });

        const device = await waitForDevice({ pairingMethods: ['SkipPairing'] });

        const passphraseHandler = (value: string) => () => {
            TrezorConnect.uiResponse({
                type: 'ui-receive_passphrase',
                payload: {
                    passphraseOnDevice: false,
                    value,
                },
            });
            TrezorConnect.removeAllListeners('ui-request_passphrase');
        };

        let result;

        // pair
        result = await TrezorConnect.getFeatures({ device });
        expect(result).toMatchObject({ success: true });

        TrezorConnect.on('ui-request_passphrase', passphraseHandler(''));

        // 4. reject ButtonRequest from host
        TrezorConnect.removeAllListeners('ui-button');
        TrezorConnect.on('ui-button', cancelOnHost);
        result = await TrezorConnect.getAddress({
            device,
            path: "m/44'/0'/0'/1/1",
            showOnTrezor: true,
        });
        if (result.success) throw ERR;
        expect(result.payload.error).toMatch(CANCEL_ERR);

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
        expect(result.payload.error).toMatch(FW_CANCEL_ERR);

        // 5. reject passphrase from host
        TrezorConnect.removeAllListeners('ui-request_passphrase');
        TrezorConnect.removeAllListeners('ui-button');
        TrezorConnect.on('ui-button', buttonRequestHandler());
        TrezorConnect.on('ui-request_passphrase', cancelOnHost);
        result = await TrezorConnect.getAddress({
            device: {
                ...device,
                instance: 1,
            },
            path: "m/44'/0'/0'/1/1",
            showOnTrezor: true,
        });
        if (result.success) throw ERR;
        expect(result.payload.error).toMatch(CANCEL_ERR);

        // 6. reject passphrase from Trezor
        TrezorConnect.removeAllListeners('ui-request_passphrase');
        TrezorConnect.removeAllListeners('ui-button');
        TrezorConnect.on('ui-request_passphrase', passphraseHandler('a'));
        TrezorConnect.on('ui-button', buttonRequestHandler('passphrase_host1')); // NOTE: .name may be changed in the future
        result = await TrezorConnect.getAddress({
            device: {
                ...device,
                instance: 1,
            },
            path: "m/44'/0'/0'/1/1",
            showOnTrezor: true,
        });
        if (result.success) throw ERR;
        expect(result.payload.error).toMatch(FW_CANCEL_ERR);

        // and finally check if device is still responsive
        TrezorConnect.removeAllListeners('ui-button');
        TrezorConnect.removeAllListeners('ui-request_passphrase');
        TrezorConnect.on('ui-request_passphrase', passphraseHandler('a'));
        TrezorConnect.on('ui-button', buttonRequestHandler());
        result = await TrezorConnect.getAddress({
            device: {
                ...device,
                state: 'ms1TJk4b4s7aisyL3jfrkCqwznttWwiS4r@448CCE89D32A733A1632F345:1',
                instance: 1,
            },
            path: "m/44'/0'/0'/1/1",
            showOnTrezor: true,
        });
        expect(result).toMatchObject({
            success: true,
            payload: { address: '17vNxNJDg2djoFntLUhY6BbdovTnZ9YYhn' },
        });

        // disable passphrase
        await setup(controller, { mnemonic: 'mnemonic_all' });
    });
});
