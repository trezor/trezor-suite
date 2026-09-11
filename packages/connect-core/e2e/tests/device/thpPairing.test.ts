import { vi } from 'vitest';

import TrezorConnect, {
    type Device,
    type ThpSettings,
    UI_EVENTS,
    UI_REQUESTS,
    UI_RESPONSE,
    type UiRequestEvent,
} from '../../../src';
import { THP_CREDENTIALS } from '../../common-thp-credentials';
import { getController, initTrezorConnect, restartEmu, setup } from '../../common.setup';

describe('THP pairing', () => {
    const controller = getController();

    beforeAll(async () => {
        await setup(controller, { mnemonic: 'mnemonic_all' });
    });

    afterEach(() => {
        TrezorConnect.dispose();
    });

    const waitForDevice = async (settings: Partial<ThpSettings>) => {
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
    }: Extract<UiRequestEvent, { type: typeof UI_REQUESTS.REQUEST_THP_PAIRING_TAG }>['payload']) =>
        controller.getPairingInfo(device.thp!.channel, nfcData).catch(e => {
            console.error('DebugLinkGetPairingInfo', device.thp!.channel, e);

            return { error: e.message };
        });

    it('ThpPairing SkipPairing', async () => {
        const spy = vi.fn();
        const device = await waitForDevice({ pairingMethods: ['SkipPairing'] });
        TrezorConnect.on(UI_REQUESTS.REQUEST_THP_PAIRING_TAG, spy);

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

        TrezorConnect.on(UI_REQUESTS.REQUEST_THP_PAIRING_TAG, async event => {
            const state = await getPairingInfo(event);
            TrezorConnect.removeAllListeners(UI_REQUESTS.REQUEST_THP_PAIRING_TAG);
            TrezorConnect.uiResponse({
                type: UI_RESPONSE.RECEIVE_THP_PAIRING_TAG,
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
            knownCredentials: THP_CREDENTIALS,
        });

        const pairingSpy = vi.fn();
        TrezorConnect.on(UI_REQUESTS.REQUEST_THP_PAIRING_TAG, pairingSpy);

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
        TrezorConnect.on('device-thp_credentials_changed', event => {
            credentialsSpy(event);
            // uncomment this line to generate fixtures for e2e/common-thp-credentials.ts
            // console.log('Credentials', event.credentials);
        });

        TrezorConnect.on(UI_REQUESTS.REQUEST_THP_PAIRING_TAG, async event => {
            const state = await getPairingInfo(event);
            TrezorConnect.uiResponse({
                type: UI_RESPONSE.RECEIVE_THP_PAIRING_TAG,
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
        TrezorConnect.removeAllListeners(UI_REQUESTS.REQUEST_THP_PAIRING_TAG);
        TrezorConnect.removeAllListeners(UI_EVENTS.BUTTON_REQUEST);

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
        TrezorConnect.cancel({ reason: CANCEL_ERR });
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

        TrezorConnect.on(UI_REQUESTS.REQUEST_THP_PAIRING_TAG, () => {
            TrezorConnect.removeAllListeners(UI_REQUESTS.REQUEST_THP_PAIRING_TAG);
            TrezorConnect.uiResponse({
                type: UI_RESPONSE.RECEIVE_THP_PAIRING_TAG,
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
        TrezorConnect.on(UI_REQUESTS.REQUEST_THP_PAIRING_TAG, cancelOnHost);
        result = await TrezorConnect.getFeatures({ device });
        if (result.success) throw ERR;
        expect(result.error.message).toMatch(CANCEL_ERR);
        expect(statusChangeEvents).toEqual(expectedStatusChangeEvents(1));

        // Emulate user interaction delay in order to let the device recover with ThpTransportBusy
        await new Promise(resolve => setTimeout(resolve, 1000));

        // 2. reject pairing tag request from Trezor
        TrezorConnect.removeAllListeners(UI_REQUESTS.REQUEST_THP_PAIRING_TAG);
        TrezorConnect.on(UI_REQUESTS.REQUEST_THP_PAIRING_TAG, () => {
            controller.send({ type: 'emulator-press-no' });
        });
        result = await TrezorConnect.getFeatures({ device });
        if (result.success) throw ERR;
        expect(result.error.message).toMatch(FW_CANCEL_ERR);
        expect(statusChangeEvents).toEqual(expectedStatusChangeEvents(2));

        // Emulate user interaction delay in order to let the device recover with ThpTransportBusy
        await new Promise(resolve => setTimeout(resolve, 1000));

        // 3. reject pairing confirmation from Trezor
        TrezorConnect.removeAllListeners(UI_EVENTS.BUTTON_REQUEST);
        TrezorConnect.on(UI_EVENTS.BUTTON_REQUEST, () => {
            controller.send({ type: 'emulator-press-no' });
        });
        result = await TrezorConnect.getFeatures({ device });
        if (result.success) throw ERR;
        expect(result.error.message).toMatch(FW_CANCEL_ERR);
        expect(statusChangeEvents).toEqual(expectedStatusChangeEvents(3));

        // 3. reject pairing confirmation from host
        TrezorConnect.removeAllListeners(UI_EVENTS.BUTTON_REQUEST);
        TrezorConnect.on(UI_EVENTS.BUTTON_REQUEST, cancelOnHost);
        result = await TrezorConnect.getFeatures({ device });
        if (result.success) throw ERR;
        expect(result.error.message).toMatch(FW_CANCEL_ERR); // canceled gracefully on Trezor
        expect(statusChangeEvents).toEqual(expectedStatusChangeEvents(4));

        // check if pairing is still responsive
        TrezorConnect.removeAllListeners(UI_EVENTS.BUTTON_REQUEST);
        TrezorConnect.removeAllListeners(UI_REQUESTS.REQUEST_THP_PAIRING_TAG);
        TrezorConnect.on(UI_EVENTS.BUTTON_REQUEST, buttonRequestHandler());
        TrezorConnect.on(UI_REQUESTS.REQUEST_THP_PAIRING_TAG, async event => {
            const state = await getPairingInfo(event);
            TrezorConnect.uiResponse({
                type: UI_RESPONSE.RECEIVE_THP_PAIRING_TAG,
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
                type: UI_RESPONSE.RECEIVE_PASSPHRASE,
                payload: {
                    passphraseOnDevice: false,
                    value,
                },
            });
            TrezorConnect.removeAllListeners(UI_REQUESTS.REQUEST_PASSPHRASE);
        };

        let result;

        // pair
        result = await TrezorConnect.getFeatures({ device });
        expect(result).toMatchObject({ success: true });

        TrezorConnect.on(UI_REQUESTS.REQUEST_PASSPHRASE, enterPassphraseOnHost(''));

        // 4. reject ButtonRequest from host
        TrezorConnect.removeAllListeners(UI_EVENTS.BUTTON_REQUEST);
        TrezorConnect.on(UI_EVENTS.BUTTON_REQUEST, cancelOnHost);
        result = await TrezorConnect.getAddress({
            device,
            path: "m/44'/0'/0'/1/1",
            showOnTrezor: true,
        });
        if (result.success) throw ERR;
        expect(result.error.message).toMatch(CANCEL_ERR);

        // 4. reject ButtonRequest from Trezor
        TrezorConnect.removeAllListeners(UI_EVENTS.BUTTON_REQUEST);
        TrezorConnect.on(UI_EVENTS.BUTTON_REQUEST, () => {
            controller.send({ type: 'emulator-press-no' });
        });
        result = await TrezorConnect.getAddress({
            device,
            path: "m/44'/0'/0'/1/1",
            showOnTrezor: true,
        });
        if (result.success) throw ERR;
        expect(result.error.message).toMatch(FW_CANCEL_ERR);

        // 5. reject passphrase from host using TrezorConnect.cancel()
        TrezorConnect.removeAllListeners(UI_REQUESTS.REQUEST_PASSPHRASE);
        TrezorConnect.removeAllListeners(UI_EVENTS.BUTTON_REQUEST);
        TrezorConnect.on(UI_EVENTS.BUTTON_REQUEST, buttonRequestHandler());
        TrezorConnect.on(UI_REQUESTS.REQUEST_PASSPHRASE, cancelOnHost);
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

        // 6. reject passphrase from host using empty payload
        TrezorConnect.removeAllListeners(UI_REQUESTS.REQUEST_PASSPHRASE);
        TrezorConnect.removeAllListeners(UI_EVENTS.BUTTON_REQUEST);
        TrezorConnect.on(UI_EVENTS.BUTTON_REQUEST, buttonRequestHandler());
        TrezorConnect.on(UI_REQUESTS.REQUEST_PASSPHRASE, () => {
            // @ts-expect-error payload is missing
            TrezorConnect.uiResponse({
                type: 'ui-receive_passphrase',
            });
        });
        result = await TrezorConnect.getAddress({
            device: {
                ...device,
                instance: 1,
            },
            path: "m/44'/0'/0'/1/1",
            showOnTrezor: true,
        });
        if (result.success) throw ERR;
        expect(result.error.code).toMatch('Method_Cancel');

        // 7. reject passphrase from Trezor
        TrezorConnect.removeAllListeners(UI_REQUESTS.REQUEST_PASSPHRASE);
        TrezorConnect.removeAllListeners(UI_EVENTS.BUTTON_REQUEST);
        TrezorConnect.on(UI_REQUESTS.REQUEST_PASSPHRASE, enterPassphraseOnHost('a'));
        TrezorConnect.on(UI_EVENTS.BUTTON_REQUEST, buttonRequestHandler('passphrase_host1')); // NOTE: .name may be changed in the future
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
        TrezorConnect.removeAllListeners(UI_EVENTS.BUTTON_REQUEST);
        TrezorConnect.removeAllListeners(UI_REQUESTS.REQUEST_PASSPHRASE);
        TrezorConnect.on(UI_REQUESTS.REQUEST_PASSPHRASE, enterPassphraseOnHost('a'));
        TrezorConnect.on(UI_EVENTS.BUTTON_REQUEST, buttonRequestHandler());
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
