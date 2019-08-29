export interface Route {
    name: string;
    pattern: string;
    isStatic?: boolean;
    fields?: string[];
}

export const routes = [
    {
        name: 'suite-index',
        pattern: '/',
        isStatic: false,
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
        name: 'wallet-index',
        pattern: '/wallet',
        isStatic: false,
    },
    {
        name: 'onboarding-index',
        pattern: '/onboarding',
        isStatic: true,
    },
    {
        name: 'suite-device-settings',
        pattern: '/settings',
        isStatic: false,
    },
    {
        name: 'suite-device-firmware',
        pattern: '/firmware',
        isStatic: false,
    },
    {
        name: 'suite-device-backup',
        pattern: '/backup',
        isStatic: false,
    },
    {
        name: 'wallet-settings',
        pattern: '/wallet/settings',
        isStatic: false,
    },
    {
        name: 'wallet-account',
        pattern: '/wallet/account',
        isStatic: false,
    },
    {
        name: 'wallet-import',
        pattern: '/wallet/import',
        isStatic: false,
    },
    {
        name: 'wallet-account-summary',
        pattern: '/wallet/account',
        isStatic: false,
    },
    {
        name: 'wallet-account-transactions',
        pattern: '/wallet/account/transactions',
        isStatic: false,
    },
    {
        name: 'wallet-account-send',
        pattern: '/wallet/account/send',
        isStatic: false,
    },
    {
        name: 'wallet-account-receive',
        pattern: '/wallet/account/receive',
        isStatic: false,
    },
    {
        name: 'wallet-account-sign-verify',
        pattern: '/wallet/account/sign-verify',
        isStatic: false,
    },
] as const;
