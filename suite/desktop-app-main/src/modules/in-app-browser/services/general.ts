import { type InAppBrowserHostEvent } from '@suite/desktop-app-api';

import { type MainWindowProxy } from '../../../libs/main-window-proxy';
import { activeViewContext } from '../context';

export async function getActiveWebContents() {
    const { activeView } = await activeViewContext.get();

    if (!activeView || activeView.webContents.isDestroyed()) {
        return undefined;
    }

    return activeView.webContents;
}

export function sendEventToRenderer(
    mainWindowProxy: MainWindowProxy,
    event: InAppBrowserHostEvent,
) {
    mainWindowProxy.getInstance()?.webContents.send('in-app-browser/event', event);
}
