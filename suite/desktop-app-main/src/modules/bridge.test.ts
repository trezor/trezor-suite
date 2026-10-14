// Store IPC handlers registered by the module
const ipcHandlers: Record<string, (...args: any[]) => any> = {};

jest.mock('../ipcMain', () => ({
    ipcMain: {
        handle: (channel: string, handler: (...args: any[]) => any) => {
            ipcHandlers[channel] = handler;
        },
    },
}));

import { init } from './bridge';
import type { Dependencies } from './module';

const logger = {
    info: jest.fn(),
    debug: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
};

const initBridge = (isKillswitchActive: boolean) =>
    init({
        store: {} as Dependencies['store'],
        mainWindowProxy: {
            getInstance: () => undefined,
        } as unknown as Dependencies['mainWindowProxy'],
        mainThreadEmitter: { emit: jest.fn() } as unknown as Dependencies['mainThreadEmitter'],
        messageSystem: {
            getGate: () => ({ isKillswitchActive, killswitchMessageId: undefined }),
        } as unknown as Dependencies['messageSystem'],
        logger: logger as unknown as Dependencies['logger'],
    } as Dependencies);

describe('bridge module', () => {
    it('does not toggle the bridge while the message system disabled it', async () => {
        initBridge(true);

        await expect(ipcHandlers['bridge/toggle']()).resolves.toStrictEqual({
            success: false,
            error: 'DISABLED_BY_MESSAGE_SYSTEM',
        });
    });
});
