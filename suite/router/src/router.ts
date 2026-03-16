import { type Route } from '@suite-common/suite-types';
import { type WalletParams as CommonWalletParams } from '@suite-common/wallet-types';

import {
    type DashboardParams,
    decodeEarnRouteParams,
    parseDashboardParams,
    parseEarnParams,
    validateAccountRouteParams,
} from './routerParams';
import {
    type ModalAppParams,
    type RouteParams,
    type RouterAppWithParams,
    suiteRoutes,
} from './routes';

export type PathString = `/${string}`; // in format `/alpha/beta/gamma`
export type SearchString = '' | `?${string}`; // in format `?alpha=beta&gamma=delta`
export type HashString = '' | `#${string}`; // in format `#/alpha/beta/gamma`

// NOTE: this is basically a bit stricter Path from history package (file://./../../../node_modules/history/index.d.ts),
// but it is satisfied by window.location as well
export type RouterPath = {
    pathname: PathString;
    search: SearchString;
    hash: HashString;
};

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

// https://github.com/remix-run/history/blob/main/docs/api-reference.md#locationpathname
const ensurePathString = (s: string = ''): PathString =>
    (s.startsWith('/') ? s : `/${s}`) as PathString;

// https://github.com/remix-run/history/blob/main/docs/api-reference.md#locationsearch
const ensureSearchString = (s: string = ''): SearchString =>
    (!s || s.startsWith('?') ? s : `?${s}`) as SearchString;

// https://github.com/remix-run/history/blob/main/docs/api-reference.md#locationhash
const ensureHashString = (s: string = ''): HashString =>
    (!s || s.startsWith('#') ? s : `#${s}`) as HashString;

export const ensureRouterPath = (path: {
    pathname?: string;
    search?: string;
    hash?: string;
}): RouterPath => ({
    pathname: ensurePathString(path.pathname),
    search: ensureSearchString(path.search),
    hash: ensureHashString(path.hash),
});

export type RouterPathOptional = {
    pathname: RouterPath['pathname'];
    search?: RouterPath['search'];
    hash?: RouterPath['hash'];
};

export const isEqualLocation = (loc1: RouterPathOptional, loc2: RouterPathOptional) =>
    loc1.pathname === loc2.pathname &&
    (loc1.search ?? '') === (loc2.search ?? '') &&
    (loc1.hash ?? '') === (loc2.hash ?? '');

export const findRoute = (pathname: PathString) => {
    const clean = pathname.length > 1 ? pathname.replace(/\/$/, '') : pathname;

    return suiteRoutes.find(r => r.pattern === clean);
};

const parseHash = (hash: HashString) => hash.replace(/^#/, '').split('/').filter(Boolean);

const validateWalletParams = (hash: HashString): CommonWalletParams => {
    const [symbol, index, rawAccountType] = parseHash(hash);

    return validateAccountRouteParams({
        symbol,
        index,
        rawAccountType,
    });
};

const validateEarnParams = (hash: HashString) => {
    const [symbol, index, rawAccountType, rawYieldId, rawContractAddress] = parseHash(hash);

    const accountRouteParams = validateAccountRouteParams({
        symbol,
        index,
        rawAccountType,
    });
    const decodedEarnRouteParams = decodeEarnRouteParams({
        rawYieldId,
        rawContractAddress,
    });

    if (!accountRouteParams || !decodedEarnRouteParams) {
        return;
    }

    return parseEarnParams({
        ...accountRouteParams,
        ...decodedEarnRouteParams,
    });
};

const parseParamValue = <T>(value: string, defaultValue?: T) => {
    if (value === 'true') return true;
    if (value === 'false') return false;

    return value ?? defaultValue;
};

const modalAppParamsDefaultValues: ModalAppParams = {
    cancelable: true,
    variant: undefined,
};

const validateModalAppParams = (hash: HashString, params?: Route['params']): ModalAppParams => {
    const splitted = parseHash(hash);
    if (!splitted || splitted.length === 0) return modalAppParamsDefaultValues;

    return {
        ...modalAppParamsDefaultValues,
        ...Object.fromEntries(
            params?.map((param, index) => [
                param,
                parseParamValue(
                    splitted[index],
                    modalAppParamsDefaultValues[param as keyof ModalAppParams],
                ),
            ]) ?? [],
        ),
    } as ModalAppParams;
};

const validateDashboardParams = (hash: HashString): DashboardParams | undefined => {
    const [modal, networkSymbol] = parseHash(hash);

    if (modal === undefined) {
        return undefined;
    }

    const params = parseDashboardParams({ modal, networkSymbol });

    if (params && networkSymbol === undefined) {
        return {
            modal: params?.modal,
        };
    }

    return params;
};

const getAppParams = (route: Route, hash: HashString = '') => {
    switch (route.app) {
        case 'dashboard':
            return validateDashboardParams(hash);
        case 'earn':
            return validateEarnParams(hash);
        case 'wallet':
            return validateWalletParams(hash);
        default:
            return route.params ? validateModalAppParams(hash, route.params) : undefined;
    }
};

export const getAppWithParams = (path: { pathname: PathString; hash?: HashString }) => {
    const route = findRoute(path.pathname);
    const app = route?.app ?? 'unknown';
    const params = route && getAppParams(route, path.hash);

    return { app, params, route } as RouterAppWithParams;
};

export const resolveEffectiveBackgroundRouteName = (
    route: Route | undefined,
    location: { pathname: PathString; hash?: HashString },
) => {
    if (route?.isForegroundApp) {
        return getAppWithParams(location).route?.name ?? route?.name;
    }

    return route?.name;
};

export type WalletParams = CommonWalletParams;

export const getRoute = (name: Route['name']) => suiteRoutes.find(r => r.name === name);

export const getRouteHash = (route?: Route, params?: RouteParams) =>
    ensureHashString(
        params &&
            route?.params &&
            [
                '',
                ...route.params
                    .filter(p => Object.prototype.hasOwnProperty.call(params, p))
                    .map(p => params[p]),
            ].join('/'),
    );
