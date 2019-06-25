export interface Route {
    name: string;
    pattern: string;
    fields?: string[];
}

export const routes: Route[] = [
    {
        name: 'suite-index',
        pattern: '/',
    },
    {
        name: 'wallet-index',
        pattern: '/wallet/',
    },
    {
        name: 'suite-device-settings',
        pattern: '/settings/',
    },
    {
        name: 'wallet-settings',
        pattern: '/wallet/settings/',
    },
    {
        name: 'wallet-account',
        pattern: '/wallet/account/',
    },
    {
        name: 'wallet-import',
        pattern: '/wallet/import/',
    },
    {
        name: 'wallet-account-summary',
        pattern: '/wallet/account/',
    },
    {
        name: 'wallet-account-transactions',
        pattern: '/wallet/account/transactions/',
    },
    {
        name: 'wallet-account-send',
        pattern: '/wallet/account/send/',
    },
    {
        name: 'wallet-account-receive',
        pattern: '/wallet/account/receive/',
    },
    {
        name: 'wallet-account-sign-verify',
        pattern: '/wallet/account/sign-verify/',
    },
];

const PARAMS = ['coin', 'accountId'];

export const getApp = (url: string) => {
    if (url === '/' || url.indexOf('/wallet') === 0) return 'wallet';
    if (url.indexOf('/onboarding') === 0) return 'onboarding';

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

export const getRoute = (name: string, params?: { [key: string]: string }) => {
    const entry = routes.find(r => r.name === name);
    if (!entry) {
        // eslint-disable-next-line no-console
        console.error(`Route for ${name} not found`);
        return '/';
    }

    // attach params
    if (params && params !== {}) {
        let paramsString = '';
        PARAMS.forEach(key => {
            paramsString = `${paramsString}/${params[key]}`;
        });
        return `${entry.pattern}#${paramsString}`;
    }
    return entry.pattern;
};

// Prefix a url with assetPrefix (eg. name of the branch in CI)
// Useful with NextJS's Router.push() that accepts
export const getPrefixedURL = (url: string) => {
    const urlPrefix = process.env.assetPrefix || '';
    return urlPrefix + url;
};

// Strips params delimited by a hashtag from the URL
export const toInternalRoute = (route: string) => {
    // chars before # belong to the first group, # and chars after to the optional second group
    // eg. https://suite.corp.sldev.cz/wallet/account/#/eth/0 will be splitted to
    // 'https://suite.corp.sldev.cz/wallet/account/' and '#/eth/0'
    try {
        const tokens = route.match(/([^#]*)(#.*)?/);
        const group1 = tokens ? tokens[1] : route;
        return group1;
    } catch (error) {
        console.error(error);
        return route;
    }
};

// Check if the URL/route points to an in-app page
export const isInternalRoute = (route: string) => {
    return routes.find(r => r.pattern === toInternalRoute(route));
};
