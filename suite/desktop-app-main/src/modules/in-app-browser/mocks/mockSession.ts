import { type Session } from 'electron';

export type MockSession = Pick<
    Session,
    | 'setProxy'
    | 'closeAllConnections'
    | 'setPermissionRequestHandler'
    | 'setPermissionCheckHandler'
    | 'setDevicePermissionHandler'
    | 'getUserAgent'
    | 'setUserAgent'
    | 'storagePath'
>;

/**
 * A session whose asynchronous methods resolve. In memory unless given a `storagePath`.
 */
export const mockSession = (overrides: Partial<MockSession> = {}): MockSession => ({
    setProxy: jest.fn(() => Promise.resolve()),
    closeAllConnections: jest.fn(() => Promise.resolve()),
    setPermissionRequestHandler: jest.fn(),
    setPermissionCheckHandler: jest.fn(),
    setDevicePermissionHandler: jest.fn(),
    getUserAgent: () => 'Mozilla/5.0 TrezorSuite/1.0 Chrome/1.0 Electron/43.0 Safari/537.36',
    setUserAgent: jest.fn(),
    storagePath: null,
    ...overrides,
});
