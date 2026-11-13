import { NodeUsbTransport } from '@trezor/transport';
import { type AbstractTransportParams, BridgeTransport } from '@trezor/transport-common';

import { CoreInModuleNode } from './core-in-module-node';

// The repo-wide `usb` mock throws on construction to keep the native binding out of unit tests;
// NodeUsbTransport constructs a WebUSB instance, so stub it here.
jest.mock('usb', () => ({ WebUSB: class {} }));

class Probe extends CoreInModuleNode {
    public getDefaultTransports(params: AbstractTransportParams) {
        return this.defaultTransports(params);
    }
}

describe('CoreInModuleNode', () => {
    it('defaults to bridge first and node usb second', () => {
        const transports = new Probe().getDefaultTransports({ id: 'Test App' });

        expect(transports.map(transport => transport.name)).toEqual([
            'BridgeTransport',
            'NodeUsbTransport',
        ]);
        expect(transports[0]).toBeInstanceOf(BridgeTransport);
        expect(transports[1]).toBeInstanceOf(NodeUsbTransport);
    });

    it('passes the transport id to every default transport', () => {
        const transports = new Probe().getDefaultTransports({ id: 'Test App' });

        // `id` is protected on AbstractTransport; it is the bridge session owner shown to the user.
        expect(transports.map(transport => (transport as unknown as { id: string }).id)).toEqual([
            'Test App',
            'Test App',
        ]);
    });
});
