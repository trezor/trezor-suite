import { isDevToolsEnabled } from '../../../libs/dev-tools-policy';
import { SERVICE_NAME } from '../constants';
import { getActiveWebContents } from './general';

export async function toggleDevTools() {
    if (!isDevToolsEnabled) {
        logger.warn(SERVICE_NAME, 'Refused DevTools: they are disabled in this build');

        return;
    }

    const webContents = await getActiveWebContents();

    if (!webContents) return;

    if (webContents.isDevToolsOpened()) {
        webContents.closeDevTools();
    } else {
        // Detached, not docked: a docked inspector is laid out inside the view's own bounds, which
        // the renderer measures and `applyBounds` rewrites on every layout change, so the two
        // would be overwriting each other.
        webContents.openDevTools({ mode: 'detach' });
    }
}
