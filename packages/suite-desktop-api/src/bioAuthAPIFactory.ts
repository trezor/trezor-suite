import { IpcRendererEvent } from 'electron';

import { ipcRendererFallback } from './factory';
import { StrictIpcRenderer } from './ipc';

const BIO_AUTH_TIMEOUT = 60 * 1000;

export type BioAuthApi = {
    validateBioAuth: () => Promise<boolean>;
};

export const createBioAuthAPI = <R extends StrictIpcRenderer<any, IpcRendererEvent>>(
    ipcRenderer?: R,
): BioAuthApi => {
    if (!ipcRenderer) return createBioAuthAPI(ipcRendererFallback);

    return {
        validateBioAuth: () => {
            const resultPromise = new Promise<boolean>((resolve, reject) => {
                ipcRenderer.on('bio-auth/validated', () => {
                    resolve(true);
                });

                ipcRenderer.on('bio-auth/validation-failure', () => {
                    reject(false);
                });

                setTimeout(() => {
                    reject(new Error('timeout'));
                }, BIO_AUTH_TIMEOUT);
            });

            ipcRenderer.send('bio-auth/request');

            return resultPromise;
        },
    };
};
