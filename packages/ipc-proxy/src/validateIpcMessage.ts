import path from 'path';

import { ElectronIpcMainInvokeEvent } from './proxy-handler';

const defaultDirnameProvider = () => __dirname;

type ValidateIpcMessageParams = {
    ipcEvent: ElectronIpcMainInvokeEvent;
    dirnameProvider?: () => string;
};

export const validateIpcMessage = ({
    ipcEvent,
    dirnameProvider = defaultDirnameProvider,
}: ValidateIpcMessageParams) => {
    if (ipcEvent?.senderFrame?.isDestroyed()) {
        throw new Error('ipcEvent.senderFrame is destroyed');
    }

    if (ipcEvent?.senderFrame && 'url' in ipcEvent.senderFrame) {
        // Example of `ipcEvent.senderFrame.url` is:
        //      'file:///tmp/.mount_Trezorztdoqo/resources/app.asar/build/index.html'
        const parsedUrl = new URL(ipcEvent.senderFrame.url);

        const isDev = process.env.NODE_ENV !== 'production';

        if (isDev && parsedUrl.host === 'localhost:8000') {
            return; // We are ok on develop, only allowed is `localhost:8000`
        }

        if (parsedUrl.hostname !== '') {
            throw new Error(`Hostname ${parsedUrl.hostname} found, must be empty`);
        }

        if (parsedUrl.host !== '') {
            throw new Error(`Host ${parsedUrl.hostname} found, must be empty`);
        }

        if (parsedUrl.protocol !== 'file:') {
            throw new Error(`Invalid protocol "${parsedUrl.protocol}", only file: allowed`);
        }

        const dirname = dirnameProvider();

        const pathToServe = path.resolve(dirname, parsedUrl.pathname);
        const relativePath = path.normalize(path.relative(dirname, pathToServe));

        // Verify that the sender is our index.html and nothing else.
        // Electron-main is running in asar/dist, so by comparing the relativePath,
        // only our asar/build/index.html can pass the check.
        if (relativePath !== '../build/index.html') {
            throw new Error(
                `Invalid ipcEvent.senderFrame.url: "${ipcEvent.senderFrame.url}", relative path is: ${relativePath}`,
            );
        }
    } else {
        throw new Error(`Invalid ipcEvent: ${JSON.stringify(ipcEvent)}`);
    }
};
