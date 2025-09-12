import { IpcRendererEvent } from 'electron';

import { StrictIpcRenderer } from './ipc';

const BIO_AUTH_TIMEOUT = 60 * 1000;

export type BioAuthApi = {
    validateBioAuth: (options: { message: string }) => Promise<boolean>;
    isBioAuthAvailable: () => Promise<boolean>;
};

export const createBioAuthAPI = <R extends StrictIpcRenderer<any, IpcRendererEvent>>(
    ipcRenderer: R,
): BioAuthApi => ({
    validateBioAuth: (options: { message: string }) => {
        type RendererResult = {
            success: boolean;
            message?: string;
        };

        let timeoutId: ReturnType<typeof setTimeout>;

        const resultPromise = new Promise<boolean>((resolve, reject) => {
            ipcRenderer.on('bio-auth/validated', (_, result: RendererResult) => {
                if (result.success) {
                    resolve(true);
                } else {
                    reject(result.message);
                }
            });

            timeoutId = setTimeout(() => {
                reject(new Error('timeout'));
            }, BIO_AUTH_TIMEOUT);
        }).finally(() => clearTimeout(timeoutId));

        ipcRenderer.send('bio-auth/request', options);

        return resultPromise;
    },
    isBioAuthAvailable: () => {
        let timeoutId: ReturnType<typeof setTimeout>;

        const resultPromise = new Promise<boolean>((resolve, reject) => {
            ipcRenderer.on('bio-auth/is-available', (_, result: boolean) => {
                resolve(result);
            });

            timeoutId = setTimeout(() => {
                reject(new Error('timeout'));
            }, BIO_AUTH_TIMEOUT);
        }).finally(() => clearTimeout(timeoutId));

        ipcRenderer.send('bio-auth/request-availability');

        return resultPromise;
    },
});
