import routes, { Route } from '@suite-constants/routes';
import { NETWORKS } from '@wallet-config';

// Prefix a url with assetPrefix (eg. name of the branch in CI)
// Useful with next.js Router.push() that accepts `as` prop as second arg
export const getPrefixedURL = (url: string) => {
    const prefix = process.env.assetPrefix;
    if (prefix && url.indexOf(prefix) !== 0) return prefix + url;
    return url;
};

export const stripPrefixedURL = (url: string) => {
    const { assetPrefix } = process.env;
    if (typeof assetPrefix === 'string' && url.indexOf(assetPrefix) === 0) {
        url = url.slice(assetPrefix.length);
    }
    return url;
};

// Strips params delimited by a hashtag from the URL
export const stripPrefixedPathname = (url: string) => {
    const [pathname] = stripPrefixedURL(url).split('#');
    return pathname.length > 1 ? pathname.replace(/\/$/, '') : pathname;
};

export const findRoute = (url: string) => {
    const clean = stripPrefixedPathname(url);
    return routes.find(r => r.pattern === clean);
};

export const findRouteByName = (name: Route['name']) => {
    return routes.find(r => r.name === name);
};

export const getApp = (url: string) => {
    const route = findRoute(url);
    return route ? route.app : 'unknown';
};

const validateWalletParams = (url: string) => {
    const [, hash] = stripPrefixedURL(url).split('#');
    if (!hash) return;
    const [symbol, index, type] = hash.split('/').filter(p => p.length > 0);
    if (!symbol || !index) return;
    const network = NETWORKS.find(
        n => n.symbol === symbol && (n.accountType || 'normal') === (type || 'normal'),
    );
    if (!network) return;
    const accountIndex = parseInt(index, 10);
    if (Number.isNaN(accountIndex)) return;
    return {
        symbol: network.symbol,
        accountIndex,
        accountType: network.accountType || 'normal',
    };
};

// Used in routerReducer
export const getAppWithParams = (url: string) => {
    const route = findRoute(url);
    if (!route) return { app: 'unknown', route: undefined, params: undefined } as const;
    if (route.app === 'wallet') {
        return {
            app: 'wallet',
            params: validateWalletParams(url),
            route,
        } as const;
    }
    return { app: route.app, route, params: undefined };
};

export type RouteParams = ReturnType<typeof validateWalletParams> | { otherPar: boolean };

export const getRoute = (name: Route['name'], params?: RouteParams) => {
    const route = findRouteByName(name);
    if (!route) return '/';
    const order = route.params;
    if (params && order) {
        const paramsString = Object.entries(params)
            // sort by order defined in routes
            .sort((a, b) => {
                const aIndex = order.findIndex(o => o === a[0]);
                const bIndex = order.findIndex(o => o === b[0]);
                return aIndex - bIndex;
            })
            .reduce((val, curr) => {
                // exclude accountType="normal" (most of accounts are normal)
                if (curr[0] === 'accountType' && curr[1] === 'normal') return val;
                return `${val}/${curr[1]}`;
            }, '');
        return `${route.pattern}#${paramsString}`;
    }
    return route.pattern;
};

// Check if the URL/route points to an in-app page
export const isInternalRoute = (url: string) => !!findRoute(url);

export const isStatic = (url: string) => {
    const route = findRoute(url);
    return route ? !!route.isStatic : true; // 404 page act as a static
};
