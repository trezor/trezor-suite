import { type TraySettings } from '@suite/desktop-app-api';

import { type Dependencies } from './module';
import { initBackground } from './tray';
import { type Store } from '../libs/store';

type IpcHandler = (...args: any[]) => any;

const ipcHandlers: Record<string, IpcHandler> = {};

jest.mock('../ipcMain', () => ({
    ipcMain: {
        handle: (channel: string, handler: IpcHandler) => {
            ipcHandlers[channel] = handler;
        },
    },
}));

const mockTray = {
    setToolTip: jest.fn(),
    setContextMenu: jest.fn(),
    on: jest.fn(),
    destroy: jest.fn(),
};

jest.mock('electron', () => ({
    Tray: jest.fn(() => mockTray),
    Menu: { buildFromTemplate: jest.fn(template => template) },
    app: { getVersion: () => '1.0.0' },
}));

const { Tray } = jest.requireMock('electron');

const logger = {
    info: jest.fn(),
    debug: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
} as unknown as Dependencies['logger'];

const initTray = ({
    showOnTray,
    isKillswitchActive,
}: {
    showOnTray: boolean;
    isKillswitchActive: boolean;
}) => {
    let traySettings: TraySettings = { showOnTray };

    // The background modules are loaded without a handshake payload, and `ModuleInterface` makes
    // both hooks optional, neither of which the tray module does.
    const { onLoad } = initBackground({
        store: {
            getTraySettings: () => traySettings,
            setTraySettings: (settings: TraySettings) => {
                traySettings = settings;
            },
        } as unknown as Store,
        mainWindowProxy: {
            getInstance: () => undefined,
        } as unknown as Dependencies['mainWindowProxy'],
        messageSystem: {
            getGate: () => ({ isKillswitchActive, killswitchMessageId: undefined }),
            subscribe: () => () => {},
        } as unknown as Dependencies['messageSystem'],
        logger,
    } as Dependencies) as { onLoad: () => void };

    onLoad();

    return {
        changeSettings: (settings: TraySettings) =>
            ipcHandlers['tray/change-settings']?.(null, settings),
        getTraySettings: () => traySettings,
    };
};

describe('tray module', () => {
    beforeAll(() => {
        global.resourcesPath = '/resources';
    });

    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('keeps the tray while the message system disabled the app, even when it is turned off in settings', () => {
        const tray = initTray({ showOnTray: true, isKillswitchActive: true });

        tray.changeSettings({ showOnTray: false });

        // The user preference is stored, but the disabled state is the only signal a headless boot
        // has, so the tray stays.
        expect(tray.getTraySettings()).toStrictEqual({ showOnTray: false });
        expect(mockTray.destroy).not.toHaveBeenCalled();
    });

    it('hides the tray turned off in settings while the message system is not disabling the app', () => {
        const tray = initTray({ showOnTray: true, isKillswitchActive: false });
        expect(Tray).toHaveBeenCalledTimes(1);

        tray.changeSettings({ showOnTray: false });

        expect(mockTray.destroy).toHaveBeenCalledTimes(1);
    });
});
