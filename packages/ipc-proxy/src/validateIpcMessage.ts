import { type ElectronIpcMainInvokeEvent } from './types';

/**
 * The only page allowed to message the main process. The packaged renderer is served by the
 * protocol handler of `@suite/desktop-app-main` (libs/renderer-protocol.ts); development loads it
 * from the webpack dev server instead.
 */
const RENDERER_URL = 'suite://app/index.html';
const DEV_RENDERER_HOST = 'localhost:8000';

type ValidateIpcMessageParams = {
    ipcEvent: ElectronIpcMainInvokeEvent;
};

export const validateIpcMessage = ({ ipcEvent }: ValidateIpcMessageParams) => {
    if (!ipcEvent?.senderFrame || !('url' in ipcEvent.senderFrame)) {
        throw new Error(`Invalid ipcEvent: ${JSON.stringify(ipcEvent)}`);
    }

    const senderUrl = ipcEvent.senderFrame.url;
    const parsedUrl = new URL(senderUrl);

    const isDev = process.env.NODE_ENV !== 'production';

    if (isDev && parsedUrl.host === DEV_RENDERER_HOST) {
        return; // We are ok on develop, only allowed is `localhost:8000`
    }

    // The query and the fragment are ignored on purpose; the scheme, the host and the path are
    // what identify Suite's own page, and nothing else can be served under them.
    const { protocol, host, pathname } = parsedUrl;
    const expectedUrl = new URL(RENDERER_URL);

    if (
        protocol !== expectedUrl.protocol ||
        host !== expectedUrl.host ||
        pathname !== expectedUrl.pathname
    ) {
        throw new Error(
            `Invalid ipcEvent.senderFrame.url: "${senderUrl}", only "${RENDERER_URL}" is allowed`,
        );
    }
};
