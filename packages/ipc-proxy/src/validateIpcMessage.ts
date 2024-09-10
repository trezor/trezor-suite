import { ElectronIpcMainInvokeEvent } from './proxy-handler';

// ipcEvent: Electron.IpcMainInvokeEvent
export const validateIpcMessage = (ipcEvent: ElectronIpcMainInvokeEvent) => {
    if (ipcEvent?.senderFrame && 'url' in ipcEvent.senderFrame) {
        const parsedUrl = new URL(ipcEvent.senderFrame.url);

        const isDev = process.env.NODE_ENV !== 'production';
        const isDevHost = isDev && parsedUrl.host === 'localhost:8000';
        const isProdHref = parsedUrl.href === 'file:///index.html';

        if (!isDevHost && !isProdHref) {
            throw new Error(`Invalid ipcEvent.senderFrame.url: "${ipcEvent.senderFrame.url}"`);
        }
    } else {
        throw new Error(`Invalid ipcEvent: ${JSON.stringify(ipcEvent)}`);
    }
};
