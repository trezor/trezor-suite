/**
 * Opens external links in the default browser (displays a warning when using Tor)
 */
import { shell, dialog, BrowserWindow } from 'electron';

import * as config from '../config';

const init = (window: BrowserWindow, store: LocalStore) => {
    const handleExternalLink = (event: Event, url: string) => {
        if (config.oauthUrls.some(u => url.startsWith(u))) {
            event.preventDefault();
            return shell.openExternal(url);
        }

        if (url !== window.webContents.getURL()) {
            event.preventDefault();

            const torSettings = store.getTorSettings();
            if (torSettings.running) {
                // TODO: Replace with in-app modal
                const result = dialog.showMessageBoxSync(window, {
                    type: 'warning',
                    message: `The following URL is going to be opened in your browser\n\n${url}`,
                    buttons: ['Cancel', 'Continue'],
                });
                // Cancel
                if (result === 0) return;
            }
            shell.openExternal(url);
        }
    };

    window.webContents.on('new-window', handleExternalLink);
    window.webContents.on('will-navigate', handleExternalLink);
};

export default init;
