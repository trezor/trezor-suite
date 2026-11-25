import { exec } from 'child_process';

import { isLinux, isMacOs, isWindows } from '@trezor/env-utils';

import { init } from './system-settings';

type IpcHandler = (ipcEvent: never, settings: string) => unknown;

const mockIpcHandlers = new Map<string, IpcHandler>();

jest.mock('child_process', () => ({
    ...jest.requireActual('child_process'),
    exec: jest.fn(),
}));

jest.mock('../ipcMain', () => ({
    ipcMain: {
        handle: (channel: string, handler: IpcHandler) => {
            mockIpcHandlers.set(channel, handler);
        },
    },
}));

jest.mock('@trezor/env-utils', () => ({
    ...jest.requireActual('@trezor/env-utils'),
    isLinux: jest.fn(),
    isMacOs: jest.fn(),
    isWindows: jest.fn(),
}));

const mockPlatform = (platform: 'linux' | 'macos' | 'windows' | 'other') => {
    jest.mocked(isLinux).mockReturnValue(platform === 'linux');
    jest.mocked(isMacOs).mockReturnValue(platform === 'macos');
    jest.mocked(isWindows).mockReturnValue(platform === 'windows');
};

const mockExecResult = (error: Error | null) => {
    jest.mocked(exec).mockImplementation(((
        _cmd: string,
        _options: unknown,
        callback: (err: Error | null) => void,
    ) => {
        callback(error);

        return {} as never;
    }) as never);
};

const openSettings = (settings: string) => {
    const handler = mockIpcHandlers.get('system/open-settings');

    return handler!({} as never, settings);
};

const executedCommands = () => jest.mocked(exec).mock.calls.map(([cmd]) => cmd);

describe('system-settings', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        mockExecResult(null);
        mockPlatform('other');
        init({} as never);
    });

    describe('open bluetooth settings', () => {
        it('opens the Bluetooth pane of macOS System Settings', async () => {
            mockPlatform('macos');

            await expect(openSettings('bluetooth')).resolves.toEqual({ success: true });

            expect(executedCommands()).toEqual([
                'open "x-apple.systempreferences:com.apple.BluetoothSettings"',
            ]);
        });

        it('opens the GNOME Bluetooth panel on Linux', async () => {
            mockPlatform('linux');
            const originalXdg = process.env.ORIGINAL_XDG_CURRENT_DESKTOP;
            process.env.ORIGINAL_XDG_CURRENT_DESKTOP = 'ubuntu:GNOME';

            try {
                await expect(openSettings('bluetooth')).resolves.toEqual({ success: true });
            } finally {
                if (originalXdg === undefined) {
                    delete process.env.ORIGINAL_XDG_CURRENT_DESKTOP;
                } else {
                    process.env.ORIGINAL_XDG_CURRENT_DESKTOP = originalXdg;
                }
            }

            expect(executedCommands()).toEqual(['gnome-control-center bluetooth']);
        });

        it('opens the Windows Bluetooth settings page', async () => {
            mockPlatform('windows');

            await expect(openSettings('bluetooth')).resolves.toEqual({ success: true });

            expect(executedCommands()).toEqual(['start ms-settings:bluetooth']);
        });

        it('fails without running a command on other systems', async () => {
            const result = await openSettings('bluetooth');

            expect(result).toEqual({
                success: false,
                error: expect.stringContaining('Cannot open system settings'),
            });
            expect(exec).not.toHaveBeenCalled();
        });

        it('reports a failure when the command itself fails', async () => {
            mockPlatform('macos');
            mockExecResult(new Error('open: command failed'));

            await expect(openSettings('bluetooth')).resolves.toEqual({
                success: false,
                error: expect.stringContaining('Cannot open system settings'),
            });
        });
    });

    describe('open bluetooth permissions', () => {
        it('opens the macOS Bluetooth privacy pane', async () => {
            mockPlatform('macos');

            await expect(openSettings('bluetooth-permissions')).resolves.toEqual({
                success: true,
            });

            expect(executedCommands()).toEqual([
                'open "x-apple.systempreferences:com.apple.preference.security?Privacy_Bluetooth"',
            ]);
        });

        it('fails without running a command outside macOS', async () => {
            mockPlatform('linux');

            const result = await openSettings('bluetooth-permissions');

            expect(result).toEqual({
                success: false,
                error: expect.stringContaining('Cannot open system settings'),
            });
            expect(exec).not.toHaveBeenCalled();
        });
    });

    it('rejects an unknown settings target', () => {
        expect(openSettings('unknown')).toEqual({
            success: false,
            error: 'Unknown settings: unknown',
        });
        expect(exec).not.toHaveBeenCalled();
    });
});
