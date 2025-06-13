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
        validateBioAuth: () => {
            const resultPromise = Promise.race([
                new Promise<boolean>((resolve, reject) => {
                    ipcRenderer.on('bio-auth/validated', (_, result: boolean) => {
                        if (result) {
                            resolve(true);
                        } else {
                            reject(false);
                        }
                    });

                    setTimeout(() => {
                        reject(new Error('timeout'));
                    }, BIO_AUTH_TIMEOUT);
                }),
                createTimeoutPromise(),
            ]);

            ipcRenderer.send('bio-auth/request');

            return resultPromise;
        },
        isBioAuthAvailable: () => {
            const resultPromise = Promise.race([
                new Promise<boolean>((resolve, reject) => {
                    ipcRenderer.on('bio-auth/is-available', (_, result: boolean) => {
                        resolve(result);
                    });

                    setTimeout(() => {
                        reject(new Error('timeout'));
                    }, BIO_AUTH_TIMEOUT);
                }),
                createTimeoutPromise(),
            ]);

            ipcRenderer.send('bio-auth/request-availability');

            return resultPromise;
        },
    };
};
