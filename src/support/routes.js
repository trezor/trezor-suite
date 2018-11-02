/* @flow */

export type Route = {
    +name: string;
    +pattern: string;
    fields: Array<string>;
}

export const routes: Array<Route> = [
    {
        name: 'landing-home',
        pattern: '/',
        fields: [],
    },
    {
        name: 'landing-bridge',
        pattern: '/bridge',
        fields: ['bridge'],
    },
    {
        name: 'landing-import',
        pattern: '/import',
        fields: ['import'],
    },
    {
        name: 'wallet-settings',
        pattern: '/settings',
        fields: ['settings'],
    },
    {
        name: 'wallet-acquire',
        pattern: '/device/:device/acquire',
        fields: ['device', 'acquire'],
    },
    {
        name: 'wallet-unreadable',
        pattern: '/device/:device/unreadable',
        fields: ['device', 'unreadable'],
    },
    {
        name: 'wallet-bootloader',
        pattern: '/device/:device/bootloader',
        fields: ['device', 'bootloader'],
    },
    {
        name: 'wallet-initialize',
        pattern: '/device/:device/initialize',
        fields: ['device', 'initialize'],
    },
    {
        name: 'wallet-seedless',
        pattern: '/device/:device/seedless',
        fields: ['device', 'seedless'],
    },
    {
        name: 'wallet-firmware-update',
        pattern: '/device/:device/firmware-update',
        fields: ['device', 'firmware-update'],
    },
    {
        name: 'wallet-device-settings',
        pattern: '/device/:device/settings',
        fields: ['device', 'settings'],
    },
    {
        name: 'wallet-dashboard',
        pattern: '/device/:device',
        fields: ['device'],
    },
    {
        name: 'wallet-account-summary',
        pattern: '/device/:device/network/:network/account/:account',
        fields: ['device', 'network', 'account'],
    },
    {
        name: 'wallet-account-send',
        pattern: '/device/:device/network/:network/account/:account/send',
        fields: ['device', 'network', 'account', 'send'],
    },
    {
        name: 'wallet-account-send-override',
        pattern: '/device/:device/network/:network/account/:account/send/override',
        fields: ['device', 'network', 'account', 'send'],
    },
    {
        name: 'wallet-account-receive',
        pattern: '/device/:device/network/:network/account/:account/receive',
        fields: ['device', 'network', 'account', 'receive'],
    },
    {
        name: 'wallet-account-signverify',
        pattern: '/device/:device/network/:network/account/:account/signverify',
        fields: ['device', 'network', 'account', 'signverify'],
    },
];

export const getPattern = (name: string): string => {
    const entry = routes.find(r => r.name === name);
    if (!entry) {
        console.error(`Route for ${name} not found`);
        return '/';
    }
    return entry.pattern;
};