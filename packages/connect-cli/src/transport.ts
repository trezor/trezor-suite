import { type ConnectSettingsTransport, type UiRequestThpPairing } from '@trezor/connect';
import { NodeUsbTransport, UdpTransport, createBridgeTransports } from '@trezor/transport';
import { BluetoothTransport, TrezorBluetooth } from '@trezor/transport-bluetooth';

import { args } from './args';

/* eslint-disable no-console */

// get Transport from args
export const getCurrentTransport = () => {
    if (args._.includes('bridge') || args.bridge) return 'bridge';
    if (args._.includes('udp') || args.udp) return 'udp';
    if (args._.includes('bluetooth') || args.bluetooth) return 'bluetooth';

    return 'usb';
};

// if interaction is done by the user or resolved by DebugLink decision
export const isDebugLinkInteraction = (type: string) =>
    (typeof args.debuglink === 'boolean' && args.debuglink) ||
    (typeof args.debuglink === 'string' && ['all', type].includes(args.debuglink));

const debugTransport =
    getCurrentTransport() === 'udp'
        ? new UdpTransport({ id: 'udp', debugLink: true })
        : new NodeUsbTransport({ id: 'usb', debugLink: true });

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

    const enumerate = await debugTransport.enumerate();
    if (!enumerate.success) {
        throw new Error(enumerate.error.code);
    }
    const descriptor = enumerate.payload[0];
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

    await debugTransport.release({ ...enumerate.payload[0], session });
    await debugTransport.enumerate();
};

export const getTransport = async (): Promise<
    ConnectSettingsTransport | ConnectSettingsTransport[]
> => {
    const transportName = getCurrentTransport();

    const bluetoothApi = new TrezorBluetooth({ url: `ws://localhost:21327/` });
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
        });
    } else if (transportName === 'bridge') {
        return createBridgeTransports();
    } else if (transportName === 'udp') {
        return UdpTransport;
    }

    return NodeUsbTransport;
};
