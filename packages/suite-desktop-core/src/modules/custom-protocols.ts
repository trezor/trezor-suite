/**
 * Support custom protocols (for example: `bitcoin:`)
 */
import { app } from 'electron';

import { isValidProtocol } from '../libs/protocol';

import type { Module } from './index';

export const SERVICE_NAME = 'custom-protocols';

export const init: Module = ({ mainWindow }) => {
    const { logger } = global;

    const protocols = process.env.PROTOCOLS as unknown as string[];
    protocols.forEach((p: string) => app.setAsDefaultProtocolClient(p));

    const sendProtocolInfo = (protocol: string) => {
        if (isValidProtocol(protocol, protocols)) {
            logger.debug(SERVICE_NAME, `Send custom protocol to browser window: ${protocol}`);
            mainWindow.webContents.send('protocol/open', protocol);
        }
    };

    // App is running and custom protocol was activated (Linux, Windows)
    app.on('second-instance', (event, argv) => {
        if (['win32', 'linux'].includes(process.platform)) {
            // filter all argvs starting with one of specified custom protocol schemes
            const urls = ([] as string[]).concat(
                ...protocols.map(protocol => argv.filter(arg => arg.startsWith(`${protocol}:`))),
            );

            if (urls.length) {
                event.preventDefault();

                // if there is custom protocol, then there is just one
                const protocol = urls[0];

                global.logger.debug(
                    SERVICE_NAME,
                    `App is running and handling '${protocol}' custom protocol (Linux, Windows)`,
                );

                sendProtocolInfo(protocol);
            }
        }
    });

    // App is running and custom protocol was activated (macOS)
    app.on('open-url', (event, url) => {
        event.preventDefault();

        logger.debug(SERVICE_NAME, 'App is running and handling custom protocol (macOS)');

        if (mainWindow.isMinimized()) {
            mainWindow.restore();
        } else {
            mainWindow.focus();
        }

        sendProtocolInfo(url);
    });

    // In consequent loads, custom protocol url should be ignored
    let firstRun = true;
    const firstRunOnly = (url: string) => () => {
        if (!firstRun) return;
        firstRun = false;

        return url;
    };

    // App is launched via custom protocol (Linux, Windows)
    if (['win32', 'linux'].includes(process.platform)) {
        const { argv } = process;

        if (argv[1]) {
            logger.debug(SERVICE_NAME, 'App is launched via custom protocol (Linux, Windows)');

            if (isValidProtocol(argv[1], protocols)) {
                return firstRunOnly(argv[1]);
            }
        }
    }

    // App is launched via custom protocol (macOS)
    if (global.customProtocolUrl) {
        if (isValidProtocol(global.customProtocolUrl, protocols)) {
            return firstRunOnly(global.customProtocolUrl);
        }
    }
};
