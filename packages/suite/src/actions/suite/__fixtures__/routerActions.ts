import { findRouteByName } from '@suite-utils/router';

export const init = [
    {
        description: `success`,
        result: {
            app: 'dashboard',
            hash: undefined,
            params: undefined,
            pathname: '/',
            url: '/',
            route: findRouteByName('suite-index'),
        },
    },
    {
        description: `not called`,
        state: {
            router: {
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
];

export const onBeforePopState = [
    {
        description: `success`,
        result: true,
    },
    {
        description: `router locked`,
        state: {
            suite: {
                locks: [1],
            },
        },
        result: false,
    },
    {
        description: `device locked`,
        state: {
            suite: {
                locks: [3],
            },
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
        result: '/wallet',
    },
    {
        description: `preserve hash params`,
        url: 'wallet-index',
        hash: '/btc/0',
        preserveHash: true,
        result: '/wallet#/btc/0',
    },
    {
        description: `ignore hash params`,
        url: 'wallet-index',
        hash: '/btc/0',
        result: '/wallet',
    },
    {
        description: `ui locked`,
        state: {
            suite: {
                locks: [3],
            },
        },
        url: 'wallet-index',
    },
];

export const initialRedirection = [
    {
        description: `success`,
        app: 'welcome',
    },
    {
        description: `already initialized`,
        state: {
            suite: {
                initialRun: false,
            },
        },
        app: 'unknown', // app will be set later, after SUITE.READY
    },
    {
        description: `redirect to modal app`,
        pathname: '/bridge',
        app: 'bridge',
    },
    {
        description: `router locked`,
        state: {
            suite: {
                locks: [1],
            },
        },
        app: 'welcome',
    },
];
