import { ArrayElement } from '@suite/types/utils';

const walletParams = ['symbol', 'accountIndex', 'accountType'] as const;

const routes = [
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
    },
    {
        name: 'suite-bridge',
        pattern: '/bridge',
        app: 'notSpecified',
    },
    {
        name: 'onboarding-index',
        pattern: '/onboarding',
        app: 'onboarding',
        isModal: true,
    },
    {
        name: 'tips-index',
        pattern: '/tips',
        app: 'wallet',
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
    {
        name: 'suite-device-firmware',
        pattern: '/firmware',
        app: 'firmware',
        isModal: true,
    },
    {
        name: 'suite-switch-device',
        pattern: '/switch-device',
        app: 'deviceManagement',
        isModal: true,
    },
    {
        name: 'wallet-index',
        pattern: '/wallet',
        app: 'wallet',
        params: walletParams,
    },
    {
        name: 'wallet-send',
        pattern: '/wallet/send',
        app: 'wallet',
        params: walletParams,
    },
    {
        name: 'wallet-receive',
        pattern: '/wallet/receive',
        app: 'wallet',
        params: walletParams,
    },
    {
        name: 'wallet-sign-verify',
        pattern: '/wallet/sign-verify',
        app: 'wallet',
        params: walletParams,
    },
] as const;

export type Route = {
    isModal?: boolean;
    params?: typeof walletParams;
} & ArrayElement<typeof routes>;

export default [...routes] as Route[];
