import { randomBytes } from 'crypto';
import { powerSaveBlocker as electronPowerSaveBlocker } from 'electron';

import { type DesktopMainApp, createDesktopMainApp } from './createDesktopMainApp';
import { createPowerSaveBlocker } from './libs/createPowerSaveBlocker';
import { Logger } from './libs/logger';
import { MainWindowProxy } from './libs/main-window-proxy';
import { initUserData } from './libs/user-data';

type DesktopMainCompositionRoot = { app: DesktopMainApp };

export const createDesktopMainCompositionRoot = (): DesktopMainCompositionRoot => {
    initUserData(); // has to be before initSentry and logger

    const logger = new Logger();
    global.logger = logger;

    const mainWindowProxy = new MainWindowProxy();
    const powerSaveBlocker = createPowerSaveBlocker({ electronPowerSaveBlocker, logger });
    const cspNonce = randomBytes(16).toString('base64');

    return {
        app: createDesktopMainApp({ logger, mainWindowProxy, powerSaveBlocker, cspNonce }),
    };
};
