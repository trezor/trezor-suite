import { getRoute } from '../router';

export const init = [
    {
        description: `success`,
        state: undefined,
        result: {
            app: 'dashboard',
            hash: '',
            params: undefined,
            pathname: '/',
            loaded: true,
            anchor: undefined,
            search: '',
            route: getRoute('suite-index'),
            settingsBackRoute: { name: 'suite-index' },
        },
    },
    {
        description: `not called`,
        state: {
            router: {
                loaded: false,
                url: '/',
                pathname: '/',
                hash: undefined,
                app: 'dashboard',
                params: undefined,
                route: undefined,
            },
        },
        result: undefined,
    },
] as const;

export const onBeforePopState = [
    {
        description: `success`,
        result: true,
    },
    {
        description: `router locked`,
        state: {
            locks: { router: 1 },
        },
        result: false,
    },
    {
        description: `device locked`,
        state: {
            locks: { ui: 1 },
        },
        result: false,
    },
];

export const goto = [
    {
        description: `goto current url`,
        url: 'suite-index',
    },
    {
        description: `goto undefined (url not changed)`,
        url: 'unknown',
    },
    {
        description: `goto wallet index`,
        url: 'wallet-index',
        result: '/accounts',
    },
    {
        description: `preserve hash params`,
        url: 'wallet-index',
        hash: '/btc/0',
        preserveHash: true,
        result: '/accounts#/btc/0',
    },
    {
        description: `ignore hash params`,
        url: 'wallet-index',
        hash: '/btc/0',
        result: '/accounts',
    },
    {
        description: `ui locked`,
        state: {
            locks: { ui: 1 },
        },
        url: 'wallet-index',
    },
];
