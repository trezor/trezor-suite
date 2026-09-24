import {
    type Event,
    type WebContentsWillNavigateEventParams,
    type WebContentsWillRedirectEventParams,
} from 'electron';

import { type InAppBrowserOpenPayload } from '@suite/desktop-app-api';
import { ok } from '@trezor/type-utils';

import { Logger } from '../../../libs/logger';
import { MainWindowProxy } from '../../../libs/main-window-proxy';
import { type Store } from '../../../libs/store';
import { type StrictBrowserWindow } from '../../../typed-electron';
import { activeViewContext, inAppBrowserContext } from '../context';
import { openView } from './webContentsView';

type WebContentsListener = (...args: unknown[]) => void;

const mockWebContentsListeners = new Map<string, WebContentsListener>();

const mockWebContents = {
    id: 7,
    on: jest.fn((event: string, listener: WebContentsListener) => {
        mockWebContentsListeners.set(event, listener);
    }),
    once: jest.fn(),
    loadURL: jest.fn(() => Promise.resolve()),
    isDestroyed: () => false,
    close: jest.fn(),
    closeDevTools: jest.fn(),
    getURL: () => 'https://app.example/',
    navigationHistory: { canGoBack: () => false, canGoForward: () => false },
};

jest.mock('electron', () => ({
    WebContentsView: jest.fn(() => ({ webContents: mockWebContents, setVisible: jest.fn() })),
}));

jest.mock('./session', () => ({
    resolveSessionForOpen: jest.fn(() => Promise.resolve(ok({ storagePath: null }))),
}));

jest.mock('./popup', () => ({
    registerPopup: jest.fn(),
    registerPopupOpener: jest.fn(() => Promise.resolve()),
}));

jest.mock('./dimensions', () => ({
    handleZoomChanged: jest.fn(),
}));

globalThis.logger = new Logger('mute');

const mockMainWindowWebContents = {
    isDestroyed: () => false,
    on: jest.fn(),
    off: jest.fn(),
    send: jest.fn(),
};

const createMainWindowProxy = () => {
    const mainWindowProxy = new MainWindowProxy();

    mainWindowProxy.setInstance({
        isDestroyed: () => false,
        webContents: mockMainWindowWebContents,
        contentView: { addChildView: jest.fn(), removeChildView: jest.fn() },
    } as unknown as StrictBrowserWindow);

    return mainWindowProxy;
};

const openPayload: InAppBrowserOpenPayload = {
    url: 'https://app.example/',
    redirectExternalOrigins: ['https://pay.example'],
    popupExternalOrigins: [],
};

const getListener = (event: 'will-navigate' | 'will-redirect' | 'did-navigate') => {
    const listener = mockWebContentsListeners.get(event);

    if (listener === undefined) {
        throw new Error(`${event} listener was not registered`);
    }

    return listener;
};

const getInvocationOrder = (invocationCallOrder: number[], callIndex: number) => {
    const order = invocationCallOrder[callIndex];

    if (order === undefined) {
        throw new Error('the call was not recorded');
    }

    return order;
};

const createRedirect = (
    params: Partial<WebContentsWillRedirectEventParams>,
): Event<WebContentsWillRedirectEventParams> => ({
    url: 'https://attacker.example/',
    isMainFrame: true,
    isSameDocument: false,
    frame: null,
    preventDefault: jest.fn(),
    defaultPrevented: false,
    ...params,
});

const createNavigation = (
    params: Partial<WebContentsWillNavigateEventParams>,
): Event<WebContentsWillNavigateEventParams> => ({
    url: 'https://attacker.example/',
    isMainFrame: true,
    isSameDocument: false,
    frame: null,
    preventDefault: jest.fn(),
    defaultPrevented: false,
    ...params,
});

const navigationBlockedEvent = (url: string) => [
    'in-app-browser/event',
    { type: 'navigation-blocked', url },
];

describe('openView navigation guards', () => {
    const mainWindowProxy = createMainWindowProxy();

    beforeEach(() => {
        jest.clearAllMocks();
        mockWebContentsListeners.clear();

        inAppBrowserContext.set({ mainWindowProxy, store: {} as Store, sessions: new Map() });
        activeViewContext.set({
            activeView: undefined,
            activeEntryId: undefined,
            clearingEntryIds: new Set(),
            lastReportedRect: undefined,
            isVisibleRequested: true,
            allowedNavigationOrigins: new Set(),
            allowedPopupOrigins: new Set(),
            openPopups: new Set(),
        });
    });

    it('installs the redirect guard before the opening load starts', async () => {
        await openView(openPayload);

        const registrationIndex = mockWebContents.on.mock.calls.findIndex(
            ([event]) => event === 'will-redirect',
        );

        expect(mockWebContents.loadURL).toHaveBeenCalledWith(openPayload.url);
        expect(
            getInvocationOrder(mockWebContents.on.mock.invocationCallOrder, registrationIndex),
        ).toBeLessThan(getInvocationOrder(mockWebContents.loadURL.mock.invocationCallOrder, 0));
    });

    it('blocks a main-frame server-side redirect to an origin outside the allowlist', async () => {
        await openView(openPayload);
        const redirect = createRedirect({ url: 'https://attacker.example/landing' });

        getListener('will-redirect')(redirect);

        expect(redirect.preventDefault).toHaveBeenCalledTimes(1);
        expect(mockMainWindowWebContents.send).toHaveBeenCalledWith(
            ...navigationBlockedEvent('https://attacker.example/landing'),
        );
    });

    it.each(['about:blank', 'data:text/html,x', 'javascript:alert(1)', 'not a url'])(
        'blocks a main-frame redirect to the opaque or unparsable url %s',
        async url => {
            await openView(openPayload);
            const redirect = createRedirect({ url });

            getListener('will-redirect')(redirect);

            expect(redirect.preventDefault).toHaveBeenCalledTimes(1);
            expect(mockMainWindowWebContents.send).toHaveBeenCalledWith(
                ...navigationBlockedEvent(url),
            );
        },
    );

    it.each(['https://app.example/checkout', 'https://pay.example/callback?code=1'])(
        'follows a main-frame redirect to %s',
        async url => {
            await openView(openPayload);
            const redirect = createRedirect({ url });

            getListener('will-redirect')(redirect);

            expect(redirect.preventDefault).not.toHaveBeenCalled();
            expect(mockMainWindowWebContents.send).not.toHaveBeenCalledWith(
                'in-app-browser/event',
                expect.objectContaining({ type: 'navigation-blocked' }),
            );
        },
    );

    it('leaves a subframe redirect to the page', async () => {
        await openView(openPayload);
        const redirect = createRedirect({ url: 'https://attacker.example/', isMainFrame: false });

        getListener('will-redirect')(redirect);

        expect(redirect.preventDefault).not.toHaveBeenCalled();
    });

    it('reports a refused redirect of the opening load as a failed load', async () => {
        await openView(openPayload);
        const redirect = createRedirect({ url: 'https://www.app.example/' });

        getListener('will-redirect')(redirect);

        expect(mockMainWindowWebContents.send).toHaveBeenCalledWith('in-app-browser/event', {
            type: 'load-failed',
            url: openPayload.url,
            error: expect.stringContaining('https://www.app.example/'),
        });
    });

    it('does not report a refused redirect as a failed load once a page has committed', async () => {
        await openView(openPayload);
        getListener('did-navigate')({}, openPayload.url);
        const redirect = createRedirect({ url: 'https://attacker.example/' });

        getListener('will-redirect')(redirect);

        expect(redirect.preventDefault).toHaveBeenCalledTimes(1);
        expect(mockMainWindowWebContents.send).not.toHaveBeenCalledWith(
            'in-app-browser/event',
            expect.objectContaining({ type: 'load-failed' }),
        );
    });

    it('blocks a navigation the page starts to an origin outside the allowlist', async () => {
        await openView(openPayload);
        const navigation = createNavigation({ url: 'https://attacker.example/' });

        getListener('will-navigate')(navigation);

        expect(navigation.preventDefault).toHaveBeenCalledTimes(1);
        expect(mockMainWindowWebContents.send).toHaveBeenCalledWith(
            ...navigationBlockedEvent('https://attacker.example/'),
        );
    });

    it('follows a navigation the page starts within the allowlist', async () => {
        await openView(openPayload);
        const navigation = createNavigation({ url: 'https://pay.example/checkout' });

        getListener('will-navigate')(navigation);

        expect(navigation.preventDefault).not.toHaveBeenCalled();
    });
});
