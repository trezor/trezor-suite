import isDev from 'electron-is-dev';
import { MODULES, MODULES_DEV, MODULES_PROD } from '@desktop-electron/libs/constants';

const modules = async (dependencies: Dependencies) => {
    const { logger } = global;

    logger.info('modules', `Loading ${MODULES.length} modules`);

    await Promise.all(
        [...MODULES, ...(isDev ? MODULES_DEV : MODULES_PROD)].flatMap(async module => {
            logger.debug('modules', `Loading ${module}`);

            try {
                const m = await import(`./modules/${module}`);
                return [m.default(dependencies)];
            } catch (err) {
                logger.error('modules', `Couldn't load ${module} (${err.toString()})`);
            }
        }),
    );

    logger.info('modules', 'All modules loaded');
};

export default modules;
