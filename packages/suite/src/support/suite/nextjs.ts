import { join } from 'path';

export const resolveStaticPath = (path: string) => {
    if (process.env.assetPrefix) {
        return join(process.env.assetPrefix, path);
    }

    return path;
};
