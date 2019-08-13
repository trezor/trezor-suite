import { routes } from '@suite-constants/routes';

type AnyRouteName = typeof routes[number]['name'];

const PARAMS = ['coin', 'accountId'] as const;

// Prefix a url with assetPrefix (eg. name of the branch in CI)
// Useful with NextJS's Router.push() that accepts `as` prop as second arg
export const getPrefixedURL = (url: string) => {
    const urlPrefix = process.env.assetPrefix || '';
    return urlPrefix + url;
};

export const getApp = (url: string) => {
    if (url === '/' || url.indexOf(getPrefixedURL('/wallet')) === 0) return 'wallet';
    if (url.indexOf(getPrefixedURL('/onboarding')) === 0) return 'onboarding';

    return 'unknown';
};

export const getParams = (url: string) => {
    const split = url.split('#');
    if (!split[1]) return {};
    const parts = split[1].substr(1, split[1].length).split('/');

    const params: { [key: string]: string } = {};
    PARAMS.forEach((key, index) => {
        params[key] = parts[index];
    });
    return params;
};

export const getRoute = (name: AnyRouteName, params?: { [key: string]: string }) => {
    const entry = routes.find(r => r.name === name);
    // attach params
    if (params && params !== {}) {
        let paramsString = '';
        PARAMS.forEach(key => {
            // eslint-disable-next-line no-prototype-builtins
            if (params.hasOwnProperty(key)) {
                paramsString = `${paramsString}/${params[key]}`;
            }
        });
        return `${entry.pattern}#${paramsString}`;
    }
    return entry.pattern;
};

// Strips params delimited by a hashtag from the URL
export const toInternalRoute = (route: string) => {
    // chars before # belong to the first group, # and chars after to the optional second group
    // eg. https://suite.corp.sldev.cz/wallet/account/#/eth/0 will be split to
    // 'https://suite.corp.sldev.cz/wallet/account/' and '#/eth/0'
    try {
        // https://suite.corp.sldev.cz/suite-web/onboarding/improvements/onboarding/
        // if there is an URL prefix remove it(eg. branch name on CI)
        const urlPrefix = process.env.assetPrefix;
        let strippedPrefix = route;
        if (urlPrefix && route.indexOf(urlPrefix) === 0) {
            strippedPrefix = strippedPrefix.slice(urlPrefix.length);
        }
        // split path and params
        const tokens = strippedPrefix.match(/([^#]*)(#.*)?/);
        const group1 = tokens ? tokens[1] : route;
        return group1.replace(/\/+$/, ''); // strip trailing slash
    } catch (error) {
        console.error(error);
        return route;
    }
};

// Check if the URL/route points to an in-app page
export const isInternalRoute = (route: string) => {
    return !!routes.find(r => r.pattern === toInternalRoute(route));
};

export const isStatic = (route: AnyRouteName | string) => {
    const routeFound = routes.find(r => r.pattern === route);
    return routeFound ? !!routeFound.isStatic : true; // 404 page act as a static
};
