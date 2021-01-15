import isDev from 'electron-is-dev';
import { MODULES } from '@lib/constants';

const modules = async (dependencies: Dependencies) => {
    const { logger } = global;

    logger.info('modules', `Loading ${MODULES.length} modules`);

    await Promise.all(
        MODULES.flatMap(async module => {
            if (module.isDev !== undefined && module.isDev !== isDev) {
                logger.debug(
                    'modules',
                    `${module.name} was skipped because it is configured for a diferent environment`,
                );
                return [];
            }

            const deps: { [name in keyof Dependencies]: any } = {};
            module.dependencies.forEach((dep: keyof Dependencies) => {
                if (dependencies[dep] === undefined) {
                    logger.error(
                        'modules',
                        `Dependency ${dep} is missing for module ${module.name}`,
                    );
                    throw new Error(); // TODO
                }
                deps[dep] = dependencies[dep];
            });

            try {
                const m = await import(`./modules/${module.name}`);
                return [m.default(deps)];
            } catch (err) {
                logger.error('modules', `Couldn't load ${module.name} (${err.toString()})`);
            }
        }),
    );

    logger.info('modules', 'All modules loaded');
};

export default modules;
