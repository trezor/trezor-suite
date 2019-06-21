import { join } from 'path';
import { routes } from '@suite-utils/router';

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

export const toInternalRoute = (url: string) => {
    try {
        // chars before # belong to the first group, # and chars after to the optional second group
        // eg. https://suite.corp.sldev.cz/wallet/account/#/eth/0 will be splitted to
        // 'https://suite.corp.sldev.cz/wallet/account/' and '#/eth/0'
        const tokens = url.match(/([^#]*)(#.*)?/);
        const group1 = tokens ? tokens[1] : url;
        // strip trailing slash
        const lastCharPos = group1.length - 1;
        const stripped = group1[lastCharPos] === '/' ? group1.substring(0, lastCharPos) : group1;
        return stripped;
    } catch (error) {
        console.error(error);
        return url;
    }
};

export const isInternalRoute = (url: string) => {
    return routes.find(r => r.pattern === toInternalRoute(url)) || false;
};
