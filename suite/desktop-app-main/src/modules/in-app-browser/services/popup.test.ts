import {
    type BrowserWindow,
    type Event,
    type WebContentsWillNavigateEventParams,
    type WebContentsWillRedirectEventParams,
} from 'electron';

import { registerPopup } from './popup';
import { Logger } from '../../../libs/logger';
import { MainWindowProxy } from '../../../libs/main-window-proxy';
import { type Store } from '../../../libs/store';
import { type StrictBrowserWindow } from '../../../typed-electron';
import { activeViewContext, inAppBrowserContext } from '../context';

jest.mock('electron', () => ({}));

globalThis.logger = new Logger('mute');

type PopupListener = (...args: unknown[]) => void;

const mockPopupListeners = new Map<string, PopupListener>();

const mockPopupContents = {
    id: 11,
    setWindowOpenHandler: jest.fn(),
    on: jest.fn((event: string, listener: PopupListener) => {
        mockPopupListeners.set(event, listener);
    }),
};

const mockPopupWindow = {
    webContents: mockPopupContents,
    on: jest.fn(),
} as unknown as BrowserWindow;

const mockMainWindowWebContents = {
    isDestroyed: () => false,
    send: jest.fn(),
};

const createMainWindowProxy = () => {
    const mainWindowProxy = new MainWindowProxy();

    mainWindowProxy.setInstance({
        isDestroyed: () => false,
        webContents: mockMainWindowWebContents,
    } as unknown as StrictBrowserWindow);

    return mainWindowProxy;
};

const getListener = (event: 'will-navigate' | 'will-redirect') => {
    const listener = mockPopupListeners.get(event);

    if (listener === undefined) {
        throw new Error(`${event} listener was not registered`);
    }

    return listener;
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

describe('registerPopup navigation guards', () => {
    const mainWindowProxy = createMainWindowProxy();

    beforeEach(async () => {
        jest.clearAllMocks();
        mockPopupListeners.clear();

        inAppBrowserContext.set({ mainWindowProxy, store: {} as Store, sessions: new Map() });
        activeViewContext.set({
            activeView: undefined,
            activeEntryId: undefined,
            clearingEntryIds: new Set(),
            lastReportedRect: undefined,
            isVisibleRequested: true,
            allowedNavigationOrigins: new Set(['https://app.example', 'https://pay.example']),
            allowedPopupOrigins: new Set(['https://accounts.example']),
            openPopups: new Set(),
        });

        await registerPopup(mockPopupWindow);
    });

    it('blocks a main-frame server-side redirect to an origin outside both lists', () => {
        const redirect = createRedirect({ url: 'https://attacker.example/landing' });

        getListener('will-redirect')(redirect);

        expect(redirect.preventDefault).toHaveBeenCalledTimes(1);
        expect(mockMainWindowWebContents.send).toHaveBeenCalledWith(
            ...navigationBlockedEvent('https://attacker.example/landing'),
        );
    });

    it.each([
        'https://app.example/return',
        'https://pay.example/sheet',
        'https://accounts.example/signin?continue=1',
    ])('follows a main-frame redirect to %s', url => {
        const redirect = createRedirect({ url });

        getListener('will-redirect')(redirect);

        expect(redirect.preventDefault).not.toHaveBeenCalled();
        expect(mockMainWindowWebContents.send).not.toHaveBeenCalled();
    });

    it('leaves a subframe redirect to the popup page', () => {
        const redirect = createRedirect({ url: 'https://attacker.example/', isMainFrame: false });

        getListener('will-redirect')(redirect);

        expect(redirect.preventDefault).not.toHaveBeenCalled();
    });

    it('blocks a navigation the popup starts to an origin outside both lists', () => {
        const navigation = createNavigation({ url: 'about:blank' });

        getListener('will-navigate')(navigation);

        expect(navigation.preventDefault).toHaveBeenCalledTimes(1);
        expect(mockMainWindowWebContents.send).toHaveBeenCalledWith(
            ...navigationBlockedEvent('about:blank'),
        );
    });

    it('follows a navigation the popup starts within either list', () => {
        const navigation = createNavigation({ url: 'https://accounts.example/consent' });

        getListener('will-navigate')(navigation);

        expect(navigation.preventDefault).not.toHaveBeenCalled();
    });
});
