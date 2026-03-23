import { vi } from 'vitest';

// eslint-disable-next-line import/no-extraneous-dependencies
import TrezorConnect, { type ConnectSettings, type Device, type UiEvent } from '@trezor/connect';

import { getController, initTrezorConnect, restartEmu, setup } from '../../common.setup';

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

    const getPairingInfo = ({
        device,
        nfcData,
    }: Extract<UiEvent, { type: 'ui-request_thp_pairing' }>['payload']) =>
        controller.getPairingInfo(device.thp!.channel, nfcData).catch(e => {
            console.error('DebugLinkGetPairingInfo', device.thp!.channel, e);

            return { error: e.message };
        });

    it('ThpPairing SkipPairing', async () => {
        const spy = vi.fn();
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

        TrezorConnect.on('ui-request_thp_pairing', async event => {
            const state = await getPairingInfo(event);
            TrezorConnect.removeAllListeners('ui-request_thp_pairing');
            TrezorConnect.uiResponse({
                type: 'ui-receive_thp_pairing_tag',
                payload: { tag: state.nfc_secret_trezor },
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
                    host_static_key:
                        '0007070707070707070707070707070707070707070707070707070707070747',
                    trezor_static_public_key:
                        '566f6976fd42cafadf1b843ce4e6275c930d52efac878217df0ea2a23933b07d',
                    credential:
                        '0a180a064368726f6d6510001a0c5472657a6f722053756974651220884364860fbccd18f6c14890ee4cf427c6a1e7e7a4cba91866474b4b7d73cb00',
                    autoconnect: false,
                },
                {
                    host_static_key:
                        '0007070707070707070707070707070707070707070707070707070707070747',
                    trezor_static_public_key:
                        'ca9a6e4682ac461c59d75a8625c05bf3a4af01e084abc5a7fe8ad126c2d6f772',
                    credential:
                        '0a1c0a0974657374733a65326510001a0d5472657a6f72436f6e6e65637412203a4826fcf4d107240c1b9aa0c4bec6abab95e50b35950b5da8a648da135ae96d',
                    autoconnect: false,
                },
            ],
        });

        const pairingSpy = vi.fn();
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

        const credentialsSpy = vi.fn();
        TrezorConnect.on('device-thp_credentials_changed', credentialsSpy);

        TrezorConnect.on('ui-request_thp_pairing', async event => {
            const state = await getPairingInfo(event);
            TrezorConnect.uiResponse({
                type: 'ui-receive_thp_pairing_tag',
                payload: { tag: state.code_entry_code },
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
        await restartEmu(controller);

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
    const buttonRequestHandler =
        (cancelOnButtonRequestName?: string) => (br: { name?: string }) => {
            if (cancelOnButtonRequestName && cancelOnButtonRequestName === br.name) {
                controller.send({ type: 'emulator-press-no' });
            } else {
                controller.send({ type: 'emulator-press-yes' });
            }
        };

    it('ThpPairing invalid CodeEntry', async () => {
        const device = await waitForDevice({ pairingMethods: ['CodeEntry'] });

        const statusChangeEvents: string[] = [];
        TrezorConnect.on('device-thp_pairing_status_changed', ({ status }) => {
            statusChangeEvents.push(status);
        });

        TrezorConnect.on('ui-request_thp_pairing', () => {
            TrezorConnect.removeAllListeners('ui-request_thp_pairing');
            TrezorConnect.uiResponse({
                type: 'ui-receive_thp_pairing_tag',
                payload: { tag: '111111' },
            });
        });

        const result = await TrezorConnect.getFeatures({ device });
        if (result.success) throw ERR;

        expect(statusChangeEvents).toEqual(['started', 'invalid-tag']);
        expect(result.error.code).toMatch('Device_ThpPairingTagInvalid');
    });

    it('ThpPairing cancel workflow', async () => {
        const device = await waitForDevice({
            pairingMethods: ['CodeEntry'],
            knownCredentials: [],
        });

        const statusChangeEvents: string[] = [];
        TrezorConnect.on('device-thp_pairing_status_changed', ({ status }) => {
            statusChangeEvents.push(status);
        });
        const expectedStatusChangeEvents = (runs: number) =>
            Array(runs).fill(['started', 'canceled']).flat();

        let result;

        // 1. reject pairing tag request from host
        TrezorConnect.on('ui-request_thp_pairing', cancelOnHost);
        result = await TrezorConnect.getFeatures({ device });
        if (result.success) throw ERR;
        expect(result.error.message).toMatch(CANCEL_ERR);
        expect(statusChangeEvents).toEqual(expectedStatusChangeEvents(1));

        // Emulate user interaction delay in order to let the device recover with ThpTransportBusy
        await new Promise(resolve => setTimeout(resolve, 1000));

        // 2. reject pairing tag request from Trezor
        TrezorConnect.removeAllListeners('ui-request_thp_pairing');
        TrezorConnect.on('ui-request_thp_pairing', () => {
            controller.send({ type: 'emulator-press-no' });
        });
        result = await TrezorConnect.getFeatures({ device });
        if (result.success) throw ERR;
        expect(result.error.message).toMatch(FW_CANCEL_ERR);
        expect(statusChangeEvents).toEqual(expectedStatusChangeEvents(2));

        // Emulate user interaction delay in order to let the device recover with ThpTransportBusy
        await new Promise(resolve => setTimeout(resolve, 1000));

        // 3. reject pairing confirmation from Trezor
        TrezorConnect.removeAllListeners('ui-button');
        TrezorConnect.on('ui-button', () => {
            controller.send({ type: 'emulator-press-no' });
        });
        result = await TrezorConnect.getFeatures({ device });
        if (result.success) throw ERR;
        expect(result.error.message).toMatch(FW_CANCEL_ERR);
        expect(statusChangeEvents).toEqual(expectedStatusChangeEvents(3));

        // 3. reject pairing confirmation from host
        TrezorConnect.removeAllListeners('ui-button');
        TrezorConnect.on('ui-button', cancelOnHost);
        result = await TrezorConnect.getFeatures({ device });
        if (result.success) throw ERR;
        expect(result.error.message).toMatch(FW_CANCEL_ERR); // canceled gracefully on Trezor
        expect(statusChangeEvents).toEqual(expectedStatusChangeEvents(4));

        // check if pairing is still responsive
        TrezorConnect.removeAllListeners('ui-button');
        TrezorConnect.removeAllListeners('ui-request_thp_pairing');
        TrezorConnect.on('ui-button', buttonRequestHandler());
        TrezorConnect.on('ui-request_thp_pairing', async event => {
            const state = await getPairingInfo(event);
            TrezorConnect.uiResponse({
                type: 'ui-receive_thp_pairing_tag',
                payload: { tag: state.code_entry_code },
            });
        });
        result = await TrezorConnect.getFeatures({ device });
        expect(result).toMatchObject({ success: true });
        expect(statusChangeEvents).toEqual([
            ...expectedStatusChangeEvents(4),
            'started',
            'finished',
        ]);
    });

    it('ThpState cancel workflow', async () => {
        // enable passphrase
        await setup(controller, { mnemonic: 'mnemonic_all', passphrase_protection: true });

        const device = await waitForDevice({ pairingMethods: ['SkipPairing'] });

        const enterPassphraseOnHost = (value: string) => () => {
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

        TrezorConnect.on('ui-request_passphrase', enterPassphraseOnHost(''));

        // 4. reject ButtonRequest from host
        TrezorConnect.removeAllListeners('ui-button');
        TrezorConnect.on('ui-button', cancelOnHost);
        result = await TrezorConnect.getAddress({
            device,
            path: "m/44'/0'/0'/1/1",
            showOnTrezor: true,
        });
        if (result.success) throw ERR;
        expect(result.error.message).toMatch(CANCEL_ERR);

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
        expect(result.error.message).toMatch(FW_CANCEL_ERR);

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
        expect(result.error.message).toMatch(CANCEL_ERR);

        // 6. reject passphrase from Trezor
        TrezorConnect.removeAllListeners('ui-request_passphrase');
        TrezorConnect.removeAllListeners('ui-button');
        TrezorConnect.on('ui-request_passphrase', enterPassphraseOnHost('a'));
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
        expect(result.error.message).toMatch(FW_CANCEL_ERR);

        // and finally check if device is still responsive
        TrezorConnect.removeAllListeners('ui-button');
        TrezorConnect.removeAllListeners('ui-request_passphrase');
        TrezorConnect.on('ui-request_passphrase', enterPassphraseOnHost('a'));
        TrezorConnect.on('ui-button', buttonRequestHandler());
        result = await TrezorConnect.getAddress({
            device: {
                ...device,
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
