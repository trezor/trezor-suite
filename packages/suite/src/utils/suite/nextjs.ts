import { join } from 'path';

export const resolveStaticPath = (path: string) => {
    const prefix = process.env.SUITE_TYPE === 'desktop' ? '' : '/';
    const staticPath = join(prefix, 'static', path);

    if (process.env.assetPrefix) {
        return join(process.env.assetPrefix, staticPath);
    }

    return staticPath;
};
