import { NodeUsbTransport } from '@trezor/transport';
import { type AbstractTransportParams, BridgeTransport } from '@trezor/transport-common';

import { CoreInModuleNode } from './core-in-module-node';

jest.mock('@trezor/connect-core/src/backend/BlockchainLink', () => ({
    updateProxy: jest.fn(() => Promise.resolve()),
}));

// The repo-wide `usb` mock throws on construction to keep the native binding out of unit tests;
// NodeUsbTransport constructs a WebUSB instance, so stub it here.
jest.mock('usb', () => ({ WebUSB: class {} }));

const { updateProxy } = jest.requireMock('@trezor/connect-core/src/backend/BlockchainLink');

class Probe extends CoreInModuleNode {
    public getDefaultTransports(params: AbstractTransportParams) {
        return this.defaultTransports(params);
    }

    public callUpdateProxy(proxy: Parameters<Probe['updateProxy']>[0]) {
        return this.updateProxy(proxy);
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

    it('delegates proxy updates to the engine backend', async () => {
        const proxy = { uri: 'socks://localhost:9050' };
        await new Probe().callUpdateProxy(proxy);

        expect(updateProxy).toHaveBeenCalledWith(proxy);
    });

    it('accepts an undefined proxy', async () => {
        await expect(new Probe().callUpdateProxy(undefined)).resolves.toBeUndefined();
    });
});
