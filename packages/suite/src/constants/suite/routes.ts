export interface Route {
    name: string;
    pattern: string;
    isStatic?: boolean;
    fields?: string[];
}

export const routes: Route[] = [
    {
        name: 'suite-index',
        pattern: '/',
    },
    {
        name: 'suite-version',
        pattern: '/version',
        isStatic: true,
    },
    {
        name: 'suite-bridge',
        pattern: '/bridge',
        isStatic: true,
    },
    {
        name: 'suite-firmware-update',
        pattern: '/firmware-update',
    },
    {
        name: 'wallet-index',
        pattern: '/wallet',
    },
    {
        name: 'onboarding-index',
        pattern: '/onboarding',
        isStatic: true,
    },
    {
        name: 'suite-device-settings',
        pattern: '/settings',
    },
    {
        name: 'wallet-settings',
        pattern: '/wallet/settings',
    },
    {
        name: 'wallet-account',
        pattern: '/wallet/account',
    },
    {
        name: 'wallet-import',
        pattern: '/wallet/import',
    },
    {
        name: 'wallet-account-summary',
        pattern: '/wallet/account',
    },
    {
        name: 'wallet-account-transactions',
        pattern: '/wallet/account/transactions',
    },
    {
        name: 'wallet-account-send',
        pattern: '/wallet/account/send',
    },
    {
        name: 'wallet-account-receive',
        pattern: '/wallet/account/receive',
    },
    {
        name: 'wallet-account-sign-verify',
        pattern: '/wallet/account/sign-verify',
    },
];