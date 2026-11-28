import { session } from 'electron';

import { createElectronSessionInterceptor } from './create-electron-session-interceptor';

jest.mock('electron', () => {
    const createWebRequest = () => ({
        onBeforeRequest: jest.fn(),
        onBeforeSendHeaders: jest.fn(),
    });
    const updaterSession = { webRequest: createWebRequest() };

    return {
        session: {
            defaultSession: { webRequest: createWebRequest() },
            fromPartition: jest.fn(() => updaterSession),
        },
    };
});

describe('createElectronSessionInterceptor', () => {
    // The `*` scheme matches only network schemes, so without the `file:` entry `file:` requests
    // would never reach request-filter. Electron's own matching is not exercised here.
    const filterMatchingNetworkAndFileUrls = expect.objectContaining({
        urls: expect.arrayContaining(['*://*/*', 'file:///*']),
    });

    it('intercepts network and file requests of the default session', () => {
        createElectronSessionInterceptor();

        expect(session.defaultSession.webRequest.onBeforeRequest).toHaveBeenCalledWith(
            filterMatchingNetworkAndFileUrls,
            expect.any(Function),
        );
    });

    it('intercepts network and file requests of the updater session', () => {
        createElectronSessionInterceptor();

        expect(session.fromPartition).toHaveBeenCalledWith('electron-updater');
        expect(
            session.fromPartition('electron-updater').webRequest.onBeforeRequest,
        ).toHaveBeenCalledWith(filterMatchingNetworkAndFileUrls, expect.any(Function));
    });
});
