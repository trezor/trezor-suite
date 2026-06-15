// Stub the transports so the test doesn't instantiate the real `usb`/`dgram`
// backed apis (NodeUsbTransport/UdpTransport call `new WebUSB()` in their
// constructors, which throws under the jest `usb` mock). We only need
// recognizable classes to assert what mapStringTransport constructs.
jest.mock('@trezor/transport', () => ({
    BridgeTransport: class BridgeTransport {
        name = 'BridgeTransport';
        constructor(public params?: unknown) {}
    },
    NodeUsbTransport: class NodeUsbTransport {
        name = 'NodeUsbTransport';
        constructor(public params?: unknown) {}
    },
    UdpTransport: class UdpTransport {
        name = 'UdpTransport';
        constructor(public params?: unknown) {}
    },
}));

import { BridgeTransport, NodeUsbTransport, UdpTransport } from '@trezor/transport';

jest.mock('electron', () => ({ ipcMain: { handle: jest.fn(), on: jest.fn() } }));
jest.mock('../bluetooth', () => ({
    bluetoothModuleState: {
        getTransport: jest.fn(),
    },
}));

import { bluetoothModuleState } from '../bluetooth';
import { getTransportsParam, mapStringTransport } from '../trezor-connect';

const getTransport = bluetoothModuleState.getTransport as jest.Mock;

describe('mapStringTransport', () => {
    const logger = { debug: jest.fn() };
    const createLogger = jest.fn(() => logger as any);

    beforeEach(() => {
        getTransport.mockReturnValue(undefined);
        createLogger.mockClear();
    });

    it('maps known string identifiers to constructed transport instances', () => {
        expect(mapStringTransport('BridgeTransport', createLogger)).toBeInstanceOf(BridgeTransport);
        expect(mapStringTransport('NodeUsbTransport', createLogger)).toBeInstanceOf(
            NodeUsbTransport,
        );
        expect(mapStringTransport('UdpTransport', createLogger)).toBeInstanceOf(UdpTransport);
        expect(createLogger).toHaveBeenCalledWith('@trezor/transport');
    });

    it('passes logger and desktop id to constructed transports', () => {
        const result = mapStringTransport('BridgeTransport', createLogger) as any;

        expect(result.params).toEqual({
            id: 'Trezor Suite desktop',
            logger,
        });
    });

    it('passes a pre-built transport instance through unchanged', () => {
        const instance = new BridgeTransport({ id: 'test' });
        expect(mapStringTransport(instance, createLogger)).toBe(instance);
        expect(createLogger).not.toHaveBeenCalled();
    });

    it('drops unmapped string identifiers (e.g. WebUsbTransport) instead of forwarding them', () => {
        expect(mapStringTransport('WebUsbTransport', createLogger)).toBeUndefined();
        expect(mapStringTransport('NopeTransport', createLogger)).toBeUndefined();
    });
});

describe('getTransportsParam', () => {
    const logger = { debug: jest.fn() };
    const createLogger = jest.fn(() => logger as any);

    beforeEach(() => {
        getTransport.mockReset();
        createLogger.mockClear();
    });

    it('maps strings to instances and keeps pre-built instances', () => {
        getTransport.mockReturnValue(undefined);
        const nodeUsb = new NodeUsbTransport({ id: 'test' });

        const result = getTransportsParam(['BridgeTransport', nodeUsb] as any, createLogger);

        expect(result).toHaveLength(2);
        expect(result?.[0]).toBeInstanceOf(BridgeTransport);
        expect(result?.[1]).toBe(nodeUsb);
    });

    it('appends bluetooth transport when present', () => {
        const fakeBluetooth = { name: 'BluetoothTransport' } as any;
        getTransport.mockReturnValue(fakeBluetooth);

        const result = getTransportsParam(['BridgeTransport'] as any, createLogger);

        expect(result).toHaveLength(2);
        expect(result?.[0]).toBeInstanceOf(BridgeTransport);
        expect(result?.[1]).toBe(fakeBluetooth);
    });

    it('restores a Bridge instance when only bluetooth would otherwise remain', () => {
        const fakeBluetooth = { name: 'BluetoothTransport' } as any;
        getTransport.mockReturnValue(fakeBluetooth);

        for (const input of [undefined, []]) {
            const result = getTransportsParam(input, createLogger);
            expect(result?.[0]).toBe(fakeBluetooth);
            expect(result?.[1]).toBeInstanceOf(BridgeTransport);
            expect((result?.[1] as any).params).toEqual({
                id: 'Trezor Suite desktop',
                logger,
            });
        }
    });

    it('returns mapped transports as-is when bluetooth is disabled', () => {
        getTransport.mockReturnValue(undefined);

        const result = getTransportsParam(['BridgeTransport'] as any, createLogger);
        expect(result).toHaveLength(1);
        expect(result?.[0]).toBeInstanceOf(BridgeTransport);

        expect(getTransportsParam(undefined, createLogger)).toBeUndefined();
    });

    it('filters out unmapped strings rather than passing them to connect', () => {
        getTransport.mockReturnValue(undefined);

        const result = getTransportsParam(
            ['WebUsbTransport', 'BridgeTransport'] as any,
            createLogger,
        );

        expect(result).toHaveLength(1);
        expect(result?.[0]).toBeInstanceOf(BridgeTransport);
    });
});
