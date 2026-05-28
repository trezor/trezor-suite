import { isWeb } from '@trezor/env-utils';
import { BridgeTransport } from '@trezor/transport/src/transports/bridge';
import { WebUsbTransport } from '@trezor/transport-web';

import { getConnectSettingsTransports } from '../debugTransports';

jest.mock('@trezor/env-utils', () => ({
    ...jest.requireActual('@trezor/env-utils'),
    isWeb: jest.fn(),
}));

const mockIsWeb = isWeb as jest.Mock;

describe('getConnectSettingsTransports', () => {
    beforeEach(() => {
        mockIsWeb.mockReset();
    });

    it('maps web debug string identifiers to transport classes', () => {
        mockIsWeb.mockReturnValue(true);

        expect(getConnectSettingsTransports(['BridgeTransport', 'WebUsbTransport'])).toEqual([
            BridgeTransport,
            WebUsbTransport,
        ]);
    });

    it('drops unsupported web debug string identifiers', () => {
        mockIsWeb.mockReturnValue(true);

        expect(getConnectSettingsTransports(['NodeUsbTransport', 'BridgeTransport'])).toEqual([
            BridgeTransport,
        ]);
    });

    it('passes non-web transports through for IPC and native callers', () => {
        mockIsWeb.mockReturnValue(false);
        const debugTransports = ['BridgeTransport', BridgeTransport];

        expect(getConnectSettingsTransports(debugTransports)).toBe(debugTransports);
    });
});
