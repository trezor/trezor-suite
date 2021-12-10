/**
 * Adds a CSP (Content Security Policy) header to all requests
 */

import { app, dialog } from 'electron';
import * as config from '../config';
import { Dependencies, Module } from './index';

const disableCspFlag = app.commandLine.hasSwitch('disable-csp');

const init: Module = ({ mainWindow, interceptor }: Dependencies) => {
    const { logger } = global;

    if (disableCspFlag) {
        logger.warn('csp', 'The application was launched with CSP disabled');
        dialog.showMessageBox(mainWindow, {
            type: 'warning',
            message:
                'The application is running with CSP disabled. This is a security risk! If this is not intentional, please close the application immediately.',
            buttons: ['OK'],
        });
    } else {
        interceptor.onHeadersReceived(details => {
            logger.debug('csp', `Header applied to ${details.url}`);

            return {
                responseHeaders: {
                    'Content-Security-Policy': [config.cspRules.join(';')],
                    ...details.responseHeaders,
                },
            };
        });
    }
};

export default init;
