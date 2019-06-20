import { join } from 'path';

export const resolveStaticPath = (path: string) => {
    const staticPath = join('/static', path);

    if (process.env.assetPrefix) {
        return join(process.env.assetPrefix, staticPath);
    }

    return staticPath;
};

export const getPrefixedURL = (url: string) => {
    const urlPrefix = process.env.assetPrefix || '';
    return urlPrefix + url;
};
