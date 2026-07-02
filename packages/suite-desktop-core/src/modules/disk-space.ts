/**
 * Generic disk-space query for the volume holding the app's data directory. Used by features that
 * need a free-space pre-flight check (e.g. the local Monero node's pruned blockchain).
 */
import { statfs } from 'fs/promises';

import { type DiskSpace, type InvokeResult } from '@trezor/suite-desktop-api';

import { app, ipcMain } from '../typed-electron';
import type { ModuleInit } from './module';

export const SERVICE_NAME = 'disk-space';

export const init: ModuleInit = () => {
    ipcMain.handle('os/get-disk-space', async (): Promise<InvokeResult<DiskSpace>> => {
        try {
            const stats = await statfs(app.getPath('userData'));

            return {
                success: true,
                payload: {
                    free: stats.bavail * stats.bsize, // blocks available to a non-privileged user
                    total: stats.blocks * stats.bsize,
                },
            };
        } catch (error) {
            return { success: false, error: error.message };
        }
    });
};
