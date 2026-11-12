import { type ElectronIpcMainInvokeEvent } from './types';

// Development loads the renderer from the webpack dev server instead of the app's own page.
const DEV_RENDERER_HOST = 'localhost:8000';

type ValidateIpcMessageParams = {
    ipcEvent: ElectronIpcMainInvokeEvent;
    /** The only page allowed to message the main process, as the app serves it. */
    rendererUrl: string;
};

export const validateIpcMessage = ({ ipcEvent, rendererUrl }: ValidateIpcMessageParams) => {
    if (!ipcEvent?.senderFrame || !('url' in ipcEvent.senderFrame)) {
        throw new Error(`Invalid ipcEvent: ${JSON.stringify(ipcEvent)}`);
    }

    const senderUrl = ipcEvent.senderFrame.url;
    const parsedUrl = new URL(senderUrl);

    const isDev = process.env.NODE_ENV !== 'production';

    if (isDev && parsedUrl.host === DEV_RENDERER_HOST) {
        return; // We are ok on develop, only allowed is `localhost:8000`
    }

    /**
     * The query and the fragment are ignored on purpose:
     * the scheme, the host and the path are what identify the app's own page.
     */
    const { protocol, host, pathname } = parsedUrl;
    const expectedUrl = new URL(rendererUrl);

    if (
        protocol !== expectedUrl.protocol ||
        host !== expectedUrl.host ||
        pathname !== expectedUrl.pathname
    ) {
        throw new Error(
            `Invalid ipcEvent.senderFrame.url: "${senderUrl}", only "${rendererUrl}" is allowed`,
        );
    }
};
