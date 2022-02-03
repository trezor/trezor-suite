/* eslint-disable import/no-dynamic-require */
/* eslint-disable global-require */
import { isDev } from '@suite-utils/build';
import { StrictBrowserWindow } from '../typed-electron';
import { MODULES, MODULES_DEV, MODULES_PROD } from './constants';

export type Dependencies = {
    mainWindow: StrictBrowserWindow;
    store: LocalStore;
    src: string;
    interceptor: RequestInterceptor;
};

export type Module = (dependencies: Dependencies) => any;

const modules: Module = async dependencies => {
    const { logger } = global;

    logger.info('modules', `Loading ${MODULES.length} modules`);

    await Promise.all(
        [...MODULES, ...(isDev ? MODULES_DEV : MODULES_PROD)].flatMap(async module => {
            logger.debug('modules', `Loading ${module}`);

            try {
                const m = await require(`./modules/${module}`);
                return [m.default(dependencies)];
            } catch (err) {
                logger.error('modules', `Couldn't load ${module} (${err.toString()})`);
            }
        }),
    );

    logger.info('modules', 'All modules loaded');
};

export default modules;
