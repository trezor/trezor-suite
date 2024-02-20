import { Route } from '@suite-common/suite-types';
import { WalletParams as CommonWalletParams } from '@suite-common/wallet-types';

import routes, { RouterAppWithParams } from 'src/constants/suite/routes';
import history from 'src/support/history';
import { NETWORKS } from 'src/config/wallet';

// Prefix a url with ASSET_PREFIX (eg. name of the branch in CI)
// Useful with next.js Router.push() that accepts `as` prop as second arg
export const getPrefixedURL = (url: string) => {
    // do not use object destructuring https://github.com/webpack/webpack/issues/5392
    const prefix = process.env.ASSET_PREFIX;
    if (prefix && url.indexOf(prefix) !== 0) return prefix + url;

    return url;
};

export const stripPrefixedURL = (url: string) => {
    // do not use object destructuring https://github.com/webpack/webpack/issues/5392
    const prefix = process.env.ASSET_PREFIX;
    if (typeof prefix === 'string' && url.indexOf(prefix) === 0) {
        url = url.slice(prefix.length);
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

export const findRouteByName = (name: Route['name']) => routes.find(r => r.name === name);

export const getApp = (url: string) => {
    const route = findRoute(url);

    return route ? route.app : 'unknown';
};

const validateWalletParams = (url: string): CommonWalletParams => {
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

const validateModalAppParams = (url: string) => {
    const [, hash] = stripPrefixedURL(url).split('#');
    if (!hash) return;
    const [cancelable] = hash.split('/').filter(p => p.length > 0);
    if (cancelable !== 'true') return;

    return {
        cancelable: true,
    };
};

// Used in routerReducer
export const getAppWithParams = (url: string): RouterAppWithParams => {
    const route = findRoute(url);

    if (!route) {
        return {
            app: 'unknown',
            route: undefined,
            params: undefined,
        };
    }

    if (route.app === 'wallet') {
        return {
            app: route.app,
            params: validateWalletParams(url),
            route,
        };
    }

    if (route.params) {
        return {
            app: route.app,
            params: validateModalAppParams(url),
            route,
        } as RouterAppWithParams;
    }

    return {
        app: route.app,
        route,
        params: undefined,
    } as RouterAppWithParams;
};

export type WalletParams = CommonWalletParams;
export type ModalAppParams = NonNullable<ReturnType<typeof validateModalAppParams>>;
export type RouteParams = WalletParams | ModalAppParams;

export const getRoute = (name: Route['name'], params?: RouteParams) => {
    const route = findRouteByName(name);
    if (!route) return '/';
    const order = route.params;
    if (params && order) {
        const paramsString = Object.entries(params)
            // sort by order defined in routes
            .sort((a, b) => {
                const aIndex = order.findIndex((o: string) => o === a[0]);
                const bIndex = order.findIndex((o: string) => o === b[0]);

                return aIndex - bIndex;
            })
            .reduce((val, curr) => {
                const exists = order.findIndex((o: string) => o === curr[0]);
                if (exists < 0) return val;
                // exclude accountType="normal" (most of accounts are normal)
                if (curr[0] === 'accountType' && curr[1] === 'normal') return val;

                return `${val}/${curr[1]}`;
            }, '');

        return paramsString.length > 0 ? `${route.pattern}#${paramsString}` : route.pattern;
    }

    return route.pattern;
};

// Used in @suite-native routerActions
export const getTopLevelRoute = (url: string) => {
    if (typeof url !== 'string') return;
    const clean = stripPrefixedPathname(url);
    const split = clean.split('/');
    split.splice(0, 1);
    if (split.length > 1) {
        return getPrefixedURL(`/${split[0]}`);
    }
};

/**
 * Used only in application modal.
 * Returns Route of application beneath the application modal. (real Router value)
 */
export const getBackgroundRoute = () =>
    findRoute(history.location.pathname + history.location.hash);
