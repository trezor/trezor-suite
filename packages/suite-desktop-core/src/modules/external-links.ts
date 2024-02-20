/**
 * Opens external links in the default browser (displays a warning when using Tor)
 */
import { shell, dialog } from 'electron';
import { HandlerDetails } from 'electron/main';

import * as config from '../config';

import type { Module } from './index';

export const SERVICE_NAME = 'external-links';

export const init: Module = ({ mainWindow, store }) => {
    const { logger } = global;

    mainWindow.webContents.setWindowOpenHandler((details: HandlerDetails) => {
        const { url } = details;
        const { protocol } = new URL(url);

        // https://benjamin-altpeter.de/shell-openexternal-dangers/
        if (!config.allowedProtocols.includes(protocol)) {
            logger.error(SERVICE_NAME, `Protocol '${protocol}' not allowed`);

            return { action: 'deny' };
        }

        if (config.oauthUrls.some(u => url.startsWith(u))) {
            logger.info(SERVICE_NAME, `${url} was allowed (OAuth list)`);
        }

        if (url !== mainWindow.webContents.getURL()) {
            const torSettings = store.getTorSettings();
            if (torSettings.running) {
                // TODO: Replace with in-app modal
                const result = dialog.showMessageBoxSync(mainWindow, {
                    type: 'warning',
                    message: `The following URL is going to be opened in your browser\n\n${url}`,
                    buttons: ['Cancel', 'Continue'],
                });
                const cancel = result === 0;
                logger.info(
                    SERVICE_NAME,
                    `${url} was ${cancel ? 'not ' : ''}allowed by user in TOR mode`,
                );

                if (cancel) {
                    // do nothing
                    return { action: 'deny' };
                }
            }
            logger.info(SERVICE_NAME, `${url} opened in default browser`);
        }

        // open URL in the user's default browser instead of headless browser window
        shell.openExternal(url).catch(err =>
            dialog.showMessageBoxSync(mainWindow, {
                type: 'error',
                message: `${err} ${url}`,
            }),
        );

        // do not open headless browser window
        return { action: 'deny' };
    });
};
