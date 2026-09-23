import { randomBytes } from 'crypto';
import { powerSaveBlocker as electronPowerSaveBlocker } from 'electron';

import { type DesktopMainApp, createDesktopMainApp } from './createDesktopMainApp';
import { createPowerSaveBlocker } from './libs/createPowerSaveBlocker';
import { Logger } from './libs/logger';
import { MainWindowProxy } from './libs/main-window-proxy';

type DesktopMainCompositionRoot = { app: DesktopMainApp };

export const createDesktopMainCompositionRoot = (): DesktopMainCompositionRoot => {
    const logger = new Logger();
    // TODO(logger-unification): remove once the logger is injected via DI everywhere.
    global.logger = logger;

    const mainWindowProxy = new MainWindowProxy();
    const powerSaveBlocker = createPowerSaveBlocker({ electronPowerSaveBlocker, logger });

    return {
        app: createDesktopMainApp({ logger, mainWindowProxy, powerSaveBlocker, randomBytes }),
    };
};
