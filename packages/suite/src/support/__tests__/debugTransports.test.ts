import { noopLogger } from '@trezor/connect-common/src/utils/debug';
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
    const createLogger = jest.fn(() => noopLogger);

    beforeEach(() => {
        mockIsWeb.mockReset();
        createLogger.mockClear();
    });

    it('maps web debug string identifiers to constructed transport instances', () => {
        mockIsWeb.mockReturnValue(true);

        const result = getConnectSettingsTransports({
            debugTransports: ['BridgeTransport', 'WebUsbTransport'],
            createLogger,
        });

        expect(result).toHaveLength(2);
        expect(result?.[0]).toBeInstanceOf(BridgeTransport);
        expect(result?.[1]).toBeInstanceOf(WebUsbTransport);
        expect(createLogger).toHaveBeenCalledWith('@trezor/transport');
    });

    it('drops unsupported web debug string identifiers', () => {
        mockIsWeb.mockReturnValue(true);

        const result = getConnectSettingsTransports({
            debugTransports: ['NodeUsbTransport', 'BridgeTransport'],
            createLogger,
        });

        expect(result).toHaveLength(1);
        expect(result?.[0]).toBeInstanceOf(BridgeTransport);
    });

    it('passes non-web transports through for IPC and native callers', () => {
        mockIsWeb.mockReturnValue(false);
        const instance = new BridgeTransport({ id: 'test' });
        const debugTransports = ['BridgeTransport', instance];

        expect(getConnectSettingsTransports({ debugTransports, createLogger })).toBe(
            debugTransports,
        );
        expect(createLogger).not.toHaveBeenCalled();
    });
});
