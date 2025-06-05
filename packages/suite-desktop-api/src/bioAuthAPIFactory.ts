import { IpcRendererEvent } from 'electron';

import { ipcRendererFallback } from './factory';
import { StrictIpcRenderer } from './ipc';

const BIO_AUTH_TIMEOUT = 60 * 1000;

export type BioAuthApi = {
    validateBioAuth: () => Promise<boolean>;
    isBioAuthAvailable: () => Promise<boolean>;
};

const createTimeoutPromise = () =>
    new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error('timeout')), BIO_AUTH_TIMEOUT);
    });

export const createBioAuthAPI = <R extends StrictIpcRenderer<any, IpcRendererEvent>>(
    ipcRenderer?: R,
): BioAuthApi => {
    if (!ipcRenderer) return createBioAuthAPI(ipcRendererFallback);

    return {
        validateBioAuth: async () => {
            try {
                // Use Promise.race to implement timeout
                const authPromise = ipcRenderer.invoke('bio-auth/authenticate');

                const result = await Promise.race([authPromise, createTimeoutPromise()]);

                if (!result || !result.success) {
                    throw new Error(result?.error || 'Authentication failed');
                }

                return true;
            } catch (error) {
                console.error('Bio authentication failed:', error);

                return Promise.reject(false);
            }
        },
        isBioAuthAvailable: async () => {
            try {
                const result = await ipcRenderer.invoke('bio-auth/is-available');

                return result.success;
            } catch (error) {
                console.error('Bio available check failed:', error);

                return false;
            }
        },
    };
};
