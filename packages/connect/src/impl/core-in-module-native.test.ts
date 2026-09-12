import { type AbstractTransportParams, BridgeTransport } from '@trezor/transport-common';

import { CoreInModuleNative } from './core-in-module-native';

jest.mock('@trezor/connect-core/src/backend/BlockchainLink', () => ({
    updateProxy: jest.fn(() => Promise.resolve()),
}));

class Probe extends CoreInModuleNative {
    public getDefaultTransports(params: AbstractTransportParams) {
        return this.defaultTransports(params);
    }
}

describe('CoreInModuleNative', () => {
    // Native must not reach for the node `usb` binding.
    it('defaults to bridge only', () => {
        const transports = new Probe().getDefaultTransports({ id: 'Test App' });

        expect(transports.map(transport => transport.name)).toEqual(['BridgeTransport']);
        expect(transports[0]).toBeInstanceOf(BridgeTransport);
    });
});
