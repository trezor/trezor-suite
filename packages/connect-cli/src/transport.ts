import { type ConnectSettingsTransport, type UiRequestThpPairing } from '@trezor/connect';
import { NodeUsbTransport, UdpTransport } from '@trezor/transport';
import { BluetoothTransport, TrezorBluetooth } from '@trezor/transport-bluetooth';
import { BridgeTransport } from '@trezor/transport-common';

import { args } from './args';

/* eslint-disable no-console */

// get Transport from args
export const getCurrentTransport = () => {
    if (args._.includes('bridge') || args.bridge) return 'bridge';
    if (args._.includes('udp') || args.udp) return 'udp';
    if (args._.includes('bluetooth') || args.bluetooth) return 'bluetooth';

    return 'usb';
};

const getLogger = () => (args.debug ? console : undefined);

// if interaction is done by the user or resolved by DebugLink decision
export const isDebugLinkInteraction = (type: string) =>
    (typeof args.debuglink === 'boolean' && args.debuglink) ||
    (typeof args.debuglink === 'string' && ['all', type].includes(args.debuglink));

const debugTransport =
    getCurrentTransport() === 'udp'
        ? new UdpTransport({ id: 'udp', debugLink: true, logger: getLogger() })
        : new NodeUsbTransport({ id: 'usb', debugLink: true, logger: getLogger() });

export const initDebugLink = async () => {
    if (args['interactive']) return;

    console.log('init', debugTransport.name, 'in DebugLink mode');
    await debugTransport.init();

    const enumerate = await debugTransport.enumerate();
    if (!enumerate.success) {
        throw new Error(enumerate.error.code);
    }
};

const waitForDebugDevice = async () => {
    let device;
    let attempt = 0;
    while (!device && attempt < 10) {
        const enumerate = await debugTransport.enumerate();
        console.log('DebugLink enumerate attempt', attempt);
        if (!enumerate.success) {
            throw new Error(enumerate.error.code);
        }
        if (enumerate.payload.length > 0) {
            device = enumerate.payload[0];
        }
        attempt++;
    }

    return device;
};

export const debugLinkState = async (uiEvent: UiRequestThpPairing['payload']) => {
    const descriptor = await waitForDebugDevice();
    if (!descriptor || !uiEvent.device.thp) {
        throw new Error('Debug device not found');
    }
    const input = { ...descriptor, previous: descriptor.session };
    const acquire = await debugTransport.acquire({ input });
    if (!acquire.success) {
        throw new Error(acquire.error.code);
    }

    const { channel } = uiEvent.device.thp;
    let nfc_secret_host, handshake_hash;
    if (uiEvent.nfcData) {
        const nfcData = Buffer.from(uiEvent.nfcData, 'hex');
        nfc_secret_host = nfcData.subarray(0, 16);
        handshake_hash = nfcData.subarray(16);
    }

    const session = acquire.payload;
    const response = await debugTransport.call({
        name: 'DebugLinkGetPairingInfo',
        data: {
            channel_id: Buffer.from(channel, 'hex'),
            handshake_hash,
            nfc_secret_host,
        },
        session,
    });

    await debugTransport.release({ ...descriptor, session });
    await debugTransport.enumerate();

    return response;
};

export const debugLinkDecision = async () => {
    if (!isDebugLinkInteraction('button')) return;

    const delayArg = args['debuglink-delay'];
    if (delayArg) {
        const delayMs = parseInt(String(delayArg), 10);

        if (!Number.isNaN(delayMs) && delayMs > 0) {
            console.log(`DebugLink: confirming in ${delayMs} ms`);
            await new Promise(resolve => setTimeout(resolve, delayMs));
        }
    }

    const enumerate = await debugTransport.enumerate();
    if (!enumerate.success) {
        throw new Error(enumerate.error.code);
    }

    const { payload } = enumerate;
    if (!payload.length) {
        // An emulator built without debuglink binds no debug port, so this list is empty and every
        // call that shows a screen used to die on `descriptor.session` being undefined -- a
        // TypeError pointing at this file rather than at the missing device. Say what is wrong.
        throw new Error(
            'Debug device not found: nothing is listening on the debuglink port (udp 21325). Build the emulator with --debug-link true, or drop --debuglink and confirm on the device.',
        );
    }
    // @ts-expect-error: indexing with noUncheckedIndexedAccess
    const descriptor: (typeof payload)[number] = payload[0];
    const input = { ...descriptor, previous: descriptor.session };

    const acquire = await debugTransport.acquire({ input });
    if (!acquire.success) {
        throw new Error(acquire.error.code);
    }

    const session = acquire.payload;
    await debugTransport.send({
        name: 'DebugLinkDecision',
        data: { button: 1 },
        session,
    });

    // @ts-expect-error: indexing with noUncheckedIndexedAccess
    const releaseDescriptor: (typeof payload)[number] = payload[0];
    await debugTransport.release({ ...releaseDescriptor, session });
    await debugTransport.enumerate();
};

export const getTransport = async (): Promise<ConnectSettingsTransport> => {
    const transportName = getCurrentTransport();

    const bluetoothApi = new TrezorBluetooth({ url: `ws://localhost:21327/`, logger: getLogger() });
    if (transportName === 'bluetooth') {
        await bluetoothApi.connect();
        const enumerate = await bluetoothApi.send('start_scan');
        const bluetoothDevice = enumerate.devices.find(d => d.paired);
        if (!bluetoothDevice) {
            throw new Error('Bluetooth Device is missing');
        }

        await bluetoothApi.send('connect_device', { id: bluetoothDevice.id, timeout: 5000 });

        await bluetoothApi.send('start_scan');

        return new BluetoothTransport({
            url: 'ws://127.0.0.1:21327',
            id: 'ble',
            logger: getLogger(),
        });
    } else if (transportName === 'bridge') {
        return new BridgeTransport({ id: 'bridge', logger: getLogger() });
    } else if (transportName === 'udp') {
        return new UdpTransport({ id: 'udp', logger: getLogger() });
    }

    return new NodeUsbTransport({ id: 'usb', logger: getLogger() });
};
