import * as ERRORS from '@trezor/connect-common/src/constants/errors';
import { createErrorMessage } from '@trezor/connect-common/src/events';
import { type ConnectImpl, TrezorConnectDynamic } from '@trezor/connect-common/src/impl/dynamic';
import type { ConnectDynamicSettings } from '@trezor/connect-common/src/types';

import { CoreInSuiteWeb } from './core-in-suite-web';

const SUITE_WEB_ERROR_TAB_URL =
    'https://suite.trezor.io/web/connect-popup/?connect-popup-err=env-not-supported';

const installChromeMock = (extensionOrigin: string) => {
    const createTab = jest.fn();
    (globalThis as any).chrome = {
        runtime: {
            id: 'test-extension-id',
            getURL: (path: string) => `${extensionOrigin}/${path}`,
            onMessage: { addListener: jest.fn(), removeListener: jest.fn() },
        },
        tabs: { create: createTab },
    };

    return { createTab };
};

type DesktopMockState = {
    isRunning: boolean;
    unsupportedMethod?: string;
};

const createDesktopMock = (state: DesktopMockState) => {
    const getConnectionMissing = () => ERRORS.TypedError('Desktop_ConnectionMissing');
    const desktop: ConnectImpl = {
        init: jest.fn(() =>
            state.isRunning ? Promise.resolve() : Promise.reject(getConnectionMissing()),
        ),
        call: jest.fn(({ method }) => {
            if (!state.isRunning) {
                return Promise.resolve(createErrorMessage(getConnectionMissing()));
            }
            if (method === state.unsupportedMethod) {
                return Promise.resolve(createErrorMessage(ERRORS.TypedError('Method_Unsupported')));
            }

            return Promise.resolve({ success: true, payload: {} });
        }),
        cancel: jest.fn(),
        dispose: jest.fn(() => Promise.resolve()),
    };

    return desktop;
};

const initConnect = (
    desktopState: DesktopMockState,
    coreMode?: ConnectDynamicSettings['coreMode'],
) => {
    const desktop = createDesktopMock(desktopState);
    const connect = new TrezorConnectDynamic({
        implementations: {
            'core-in-suite-desktop': desktop,
            'core-in-suite-web': new CoreInSuiteWeb(),
        },
    });
    const init = connect.init({
        env: 'webextension',
        coreMode,
        manifest: { email: 'test@example.com', appName: 'test', appUrl: 'https://example.com' },
    });

    return { connect, desktop, init };
};

describe('CoreInSuiteWeb in a Firefox webextension', () => {
    afterEach(() => {
        delete (globalThis as any).chrome;
    });

    it('stays on Suite desktop and opens no tab during init', async () => {
        const { createTab } = installChromeMock('moz-extension://test-uuid');
        const { init } = initConnect({ isRunning: false });

        await expect(init).resolves.toBeUndefined();
        expect(createTab).not.toHaveBeenCalled();
    });

    it('opens the Suite Web error screen whenever Suite desktop is not running for a call', async () => {
        const { createTab } = installChromeMock('moz-extension://test-uuid');
        const desktopState = { isRunning: false };
        const { connect, init } = initConnect(desktopState);
        await init;

        await expect(connect.call({ method: 'getFeatures' })).resolves.toMatchObject({
            success: false,
            error: { code: 'Desktop_ConnectionMissing' },
        });
        expect(createTab).toHaveBeenCalledTimes(1);
        expect(createTab).toHaveBeenCalledWith({ url: SUITE_WEB_ERROR_TAB_URL });

        // Suite desktop started without a new init.
        desktopState.isRunning = true;
        await expect(connect.call({ method: 'getFeatures' })).resolves.toMatchObject({
            success: true,
        });
        expect(createTab).toHaveBeenCalledTimes(1);

        // Suite desktop quit again.
        desktopState.isRunning = false;
        await expect(connect.call({ method: 'getFeatures' })).resolves.toMatchObject({
            success: false,
            error: { code: 'Desktop_ConnectionMissing' },
        });
        expect(createTab).toHaveBeenCalledTimes(2);
    });

    it('keeps the Suite desktop connection and its error when it does not know the method', async () => {
        const { createTab } = installChromeMock('moz-extension://test-uuid');
        const { connect, desktop, init } = initConnect({
            isRunning: true,
            unsupportedMethod: 'getFeatures',
        });
        await init;

        await expect(connect.call({ method: 'getFeatures' })).resolves.toMatchObject({
            success: false,
            error: { code: 'Method_Unsupported' },
        });
        expect(desktop.dispose).not.toHaveBeenCalled();
        expect(createTab).not.toHaveBeenCalled();
    });

    it('fails init with coreMode suite-web', async () => {
        const { createTab } = installChromeMock('moz-extension://test-uuid');
        const { init } = initConnect({ isRunning: true }, 'suite-web');

        await expect(init).rejects.toMatchObject({
            code: 'Handshake_Error',
            message: 'env-not-supported',
        });
        expect(createTab).not.toHaveBeenCalled();
    });
});

describe('CoreInSuiteWeb in a Chrome webextension', () => {
    afterEach(() => {
        delete (globalThis as any).chrome;
    });

    it('does not open the Suite Web error screen for Desktop_ConnectionMissing', () => {
        const { createTab } = installChromeMock('chrome-extension://test-id');
        const core = new CoreInSuiteWeb();

        core.onCallFailed({ code: 'Desktop_ConnectionMissing', message: '' });

        expect(createTab).not.toHaveBeenCalled();
    });
});
