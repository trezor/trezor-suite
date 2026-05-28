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
    beforeEach(() => {
        getTransport.mockReturnValue(undefined);
    });

    it('maps known string identifiers to DI classes', () => {
        expect(mapStringTransport('BridgeTransport')).toBe(BridgeTransport);
        expect(mapStringTransport('NodeUsbTransport')).toBe(NodeUsbTransport);
        expect(mapStringTransport('UdpTransport')).toBe(UdpTransport);
    });

    it('passes a non-string entry through (DI instance / class)', () => {
        expect(mapStringTransport(BridgeTransport)).toBe(BridgeTransport);
    });
});

describe('getTransportsParam', () => {
    beforeEach(() => {
        getTransport.mockReset();
    });

    it('maps a mix of strings and DI to all DI', () => {
        getTransport.mockReturnValue(undefined);
        expect(getTransportsParam(['BridgeTransport', NodeUsbTransport] as any)).toEqual([
            BridgeTransport,
            NodeUsbTransport,
        ]);
    });

    it('appends bluetooth transport when present', () => {
        const fakeBluetooth = { name: 'BluetoothTransport' } as any;
        getTransport.mockReturnValue(fakeBluetooth);
        expect(getTransportsParam(['BridgeTransport'] as any)).toEqual([
            BridgeTransport,
            fakeBluetooth,
        ]);
    });

    it('restores BridgeTransport when only bluetooth would otherwise remain', () => {
        const fakeBluetooth = { name: 'BluetoothTransport' } as any;
        getTransport.mockReturnValue(fakeBluetooth);
        expect(getTransportsParam(undefined)).toEqual([fakeBluetooth, BridgeTransport]);
        expect(getTransportsParam([])).toEqual([fakeBluetooth, BridgeTransport]);
    });

    it('returns mapped transports as-is when bluetooth is disabled', () => {
        getTransport.mockReturnValue(undefined);
        expect(getTransportsParam(['BridgeTransport'] as any)).toEqual([BridgeTransport]);
        expect(getTransportsParam(undefined)).toBeUndefined();
    });
});
