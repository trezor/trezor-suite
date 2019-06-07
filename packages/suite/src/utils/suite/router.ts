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
    ['coin', 'accountId'].forEach((key, index) => {
        params[key] = parts[index];
    });
    return params;
};

export interface Route {
    name: string;
    pattern: string;
    fields?: string[];
}

export const routes: Route[] = [
    {
        name: 'suite-device-settings',
        pattern: '/settings',
    },
    {
        name: 'wallet-settings',
        pattern: '/wallet/settings',
    },
];

export const getRoute = (name: string): string => {
    const entry = routes.find(r => r.name === name);
    if (!entry) {
        // eslint-disable-next-line no-console
        console.error(`Route for ${name} not found`);
        return '/';
    }
    return entry.pattern;
};
