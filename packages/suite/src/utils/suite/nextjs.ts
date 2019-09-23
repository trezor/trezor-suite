import { join } from 'path';

export const resolveStaticPath = (path: string) => {
    const staticPath = join('/static', path);
    if (process.env.assetPrefix) {
        return join(process.env.assetPrefix, staticPath);
    }

    return staticPath;
};
