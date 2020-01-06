import { ArrayElement } from '@suite/types/utils';

const walletParams = ['symbol', 'accountIndex', 'accountType'] as const;

const routes = [
    {
        name: 'wallet-index',
        pattern: '/wallet',
        app: 'wallet',
        params: walletParams,
    },
    {
        name: 'passwords-index',
        pattern: '/passwords',
        app: 'passwords',
    },
    {
        name: 'exchange-index',
        pattern: '/exchange',
        app: 'exchange',
    },
    {
        name: 'suite-index',
        pattern: '/',
        app: 'dashboard',
    },
    {
        name: 'suite-version',
        pattern: '/version',
        app: 'notSpecified',
        isStatic: true,
    },
    {
        name: 'suite-bridge',
        pattern: '/bridge',
        app: 'notSpecified',
        isStatic: true,
    },
    {
        name: 'onboarding-index',
        pattern: '/onboarding',
        app: 'onboarding',
        isStatic: true,
        isModal: true,
    },
    // todo: app will be just settings probably
    {
        name: 'settings-index',
        pattern: '/settings',
        app: 'deviceManagement',
    },
    {
        name: 'settings-debug',
        pattern: '/settings/debug',
        app: 'deviceManagement',
    },
    {
        name: 'settings-device',
        pattern: '/settings/device',
        app: 'deviceManagement',
    },
    {
        name: 'settings-dashboard',
        pattern: '/settings/dashboard',
        app: 'deviceManagement',
    },
    {
        name: 'settings-wallet',
        pattern: '/settings/wallet',
        app: 'deviceManagement',
    },
    {
        name: 'settings-coins',
        pattern: '/settings/coins',
        app: 'deviceManagement',
    },
    // todo: remove this route and move functionality to settings
    {
        name: 'suite-device-firmware',
        pattern: '/firmware',
        app: 'firmware',
        isStatic: true,
        isModal: true,
    },
    {
        name: 'suite-switch-device',
        pattern: '/switch-device',
        app: 'deviceManagement',
        isModal: true,
    },
    {
        name: 'wallet-import',
        pattern: '/wallet/import',
        app: 'wallet',
    },
    {
        name: 'wallet-account-summary',
        pattern: '/wallet/account',
        app: 'wallet',
        params: walletParams,
    },
    {
        name: 'wallet-account-transactions',
        pattern: '/wallet/account/transactions',
        app: 'wallet',
        params: walletParams,
    },
    {
        name: 'wallet-account-send',
        pattern: '/wallet/account/send',
        app: 'wallet',
        params: walletParams,
    },
    {
        name: 'wallet-account-receive',
        pattern: '/wallet/account/receive',
        app: 'wallet',
        params: walletParams,
    },
    {
        name: 'wallet-account-sign-verify',
        pattern: '/wallet/account/sign-verify',
        app: 'wallet',
        params: walletParams,
    },
] as const;

export type Route = {
    isStatic?: boolean;
    isModal?: boolean;
    params?: typeof walletParams;
} & ArrayElement<typeof routes>;

export default [...routes] as Route[];
