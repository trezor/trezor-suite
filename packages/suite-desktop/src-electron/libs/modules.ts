import { isDev } from '@suite-utils/build';

import * as eventLoggingProcess from '../modules/event-logging/process';
import * as eventLoggingApp from '../modules/event-logging/app';
import * as eventLoggingContents from '../modules/event-logging/contents';
import * as crashRecover from '../modules/crash-recover';
import * as hangDetect from '../modules/hang-detect';
import * as menu from '../modules/menu';
import * as shortcuts from '../modules/shortcuts';
import * as requestFilter from '../modules/request-filter';
import * as externalLinks from '../modules/external-links';
import * as windowControls from '../modules/window-controls';
import * as theme from '../modules/theme';
import * as httpReceiver from '../modules/http-receiver';
import * as metadata from '../modules/metadata';
import * as bridge from '../modules/bridge';
import * as tor from '../modules/tor';
import * as customProtocol from '../modules/custom-protocols';
import * as autoUpdater from '../modules/auto-updater';
import * as store from '../modules/store';
import * as udevInstall from '../modules/udev-install';

// Modules only used in prod mode
import * as csp from '../modules/csp';
import * as fileProtocol from '../modules/file-protocol';

// Modules only used in dev mode
import * as devTools from '../modules/dev-tools';

const common = [
    eventLoggingProcess,
    eventLoggingApp,
    eventLoggingContents,
    crashRecover,
    hangDetect,
    menu,
    shortcuts,
    requestFilter,
    externalLinks,
    windowControls,
    theme,
    httpReceiver,
    metadata,
    bridge,
    tor,
    customProtocol,
    autoUpdater,
    store,
    udevInstall,
];

const prod = [csp, fileProtocol];

const dev = [devTools];

const modules = async (dependencies: Dependencies) => {
    const { logger } = global;
    const finalModules = [...common, ...(isDev ? dev : prod)];
    logger.info('modules', `Loading ${finalModules.length} modules`);

    const promises = finalModules.map(async module => {
        try {
            await module.default(dependencies);
        } catch (err) {
            logger.error('modules', `Couldn't load ${module} (${err.toString()})`);
        }
    });

    await Promise.all(promises);
    logger.info('modules', 'All modules loaded');
};

export default modules;
