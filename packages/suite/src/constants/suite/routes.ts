import { ArrayElement, ConstWithOptionalFields } from '@suite/types/utils';
import { Network } from '@wallet-types';

// Steps to add route params:
// 1. add params order here (example: wallet or suite-bridge)
// 2. go to @suite-utils/router and create params validation function (example: validateWalletParams or validateModalAppParams)
// 3. implement validation function in @suite-utils/router:getAppWithParams
// 4. add params types to RouteParamsTypes (below)

const walletParams = ['symbol', 'accountIndex', 'accountType'] as const;
const modalAppParams = ['cancelable'] as const;

const routes = [
    {
        name: 'suite-welcome',
        pattern: '/welcome',
        app: 'welcome',
        isModal: true,
    },
    {
        name: 'suite-start',
        pattern: '/start',
        app: 'start',
    },
    {
        name: 'suite-analytics',
        pattern: '/analytics',
        app: 'analytics',
        isModal: true,
    },
    {
        name: 'suite-index',
        pattern: '/',
        app: 'dashboard',
    },
    {
        name: 'suite-version',
        pattern: '/version',
        app: 'version',
        isModal: true,
        params: modalAppParams,
    },
    {
        name: 'suite-bridge',
        pattern: '/bridge',
        app: 'bridge',
        isModal: true,
        params: modalAppParams,
    },
    {
        name: 'suite-udev',
        pattern: '/udev',
        app: 'udev',
        isModal: true,
        params: modalAppParams,
    },
    {
        name: 'suite-log',
        pattern: '/log',
        app: 'log',
        isModal: true,
        params: modalAppParams,
    },
    {
        name: 'suite-switch-device',
        pattern: '/switch-device',
        app: 'switch-device',
        isModal: true,
        params: modalAppParams,
    },
    {
        name: 'onboarding-index',
        pattern: '/onboarding',
        app: 'onboarding',
        isModal: true,
        params: modalAppParams,
    },
    {
        name: 'settings-index',
        pattern: '/settings',
        app: 'settings',
    },
    {
        name: 'settings-debug',
        pattern: '/settings/debug',
        app: 'settings',
    },
    {
        name: 'settings-device',
        pattern: '/settings/device',
        app: 'settings',
    },
    {
        name: 'settings-coins',
        pattern: '/settings/coins',
        app: 'settings',
    },
    {
        name: 'recovery-index',
        pattern: '/recovery',
        app: 'recovery',
        isModal: true,
        params: modalAppParams,
    },
    {
        name: 'backup-index',
        pattern: '/backup',
        app: 'backup',
        isModal: true,
        params: modalAppParams,
    },
    {
        name: 'firmware-index',
        pattern: '/firmware',
        app: 'firmware',
        isModal: true,
        params: modalAppParams,
    },
    {
        name: 'wallet-index',
        pattern: '/accounts',
        app: 'wallet',
        params: walletParams,
    },
    {
        name: 'coinmarket-buy-detail',
        pattern: 'accounts/coinmarket/buy/detail',
        app: 'walletParams',
        params: walletParams,
    },
    {
        name: 'wallet-send',
        pattern: '/accounts/send',
        app: 'wallet',
        params: walletParams,
    },
    {
        name: 'wallet-receive',
        pattern: '/accounts/receive',
        app: 'wallet',
        params: walletParams,
    },
    {
        name: 'wallet-sign-verify',
        pattern: '/accounts/sign-verify',
        app: 'wallet',
        params: walletParams,
    },
    {
        name: 'wallet-coinmarket-buy',
        pattern: '/accounts/coinmarket/buy',
        app: 'wallet',
        params: walletParams,
    },
    {
        name: 'wallet-coinmarket-exchange',
        pattern: '/accounts/coinmarket/exchange',
        app: 'wallet',
        params: walletParams,
    },
    {
        name: 'wallet-coinmarket-spend',
        pattern: '/accounts/coinmarket/spend',
        app: 'wallet',
        params: walletParams,
    },
    {
        name: 'wallet-coinmarket-sell',
        pattern: '/accounts/coinmarket/sell',
        app: 'wallet',
        params: walletParams,
    },
    {
        name: 'wallet-coinmarket-buy-offers',
        pattern: '/accounts/coinmarket/buy/offers',
        app: 'wallet',
        params: walletParams,
    },
    {
        name: 'wallet-coinmarket-sell-offers',
        pattern: '/accounts/coinmarket/sell/offers',
        app: 'wallet',
        params: walletParams,
    },
    {
        name: 'wallet-coinmarket-exchange-offers',
        pattern: '/accounts/coinmarket/exchange/offers',
        app: 'wallet',
        params: walletParams,
    },
    {
        name: 'wallet-coinmarket-buy-detail',
        pattern: '/accounts/coinmarket/buy/detail',
        app: 'wallet',
        params: walletParams,
    },
    {
        name: 'wallet-coinmarket-sell-detail',
        pattern: '/accounts/coinmarket/sell/detail',
        app: 'wallet',
        params: walletParams,
    },
    {
        name: 'wallet-coinmarket-exchange-detail',
        pattern: '/accounts/coinmarket/exchange/detail',
        app: 'wallet',
        params: walletParams,
    },
    {
        name: 'wallet-details',
        pattern: '/accounts/details',
        app: 'wallet',
        params: walletParams,
    },
    {
        name: 'passwords-index',
        pattern: '/passwords',
        app: 'passwords',
    },
    {
        name: 'portfolio-index',
        pattern: '/portfolio',
        app: 'portfolio',
    },
    {
        name: 'notifications-index',
        pattern: '/notifications',
        app: 'notifications',
    },
] as const;

type RouteKeys = keyof ArrayElement<typeof routes> | 'isModal' | 'params';
export type Route = ArrayElement<ConstWithOptionalFields<typeof routes, RouteKeys>>;

type RouteParamsTypes = {
    symbol: Network['symbol'];
    accountIndex: number;
    accountType: NonNullable<Network['accountType']>;
    cancelable: boolean;
};

type ExtractType<T extends keyof RouteParamsTypes> = {
    [P in T]: RouteParamsTypes[P];
};

type AppWithParams<T extends { [key: string]: any }> = {
    [K in keyof T]: {
        app: T[K]['app'];
        route: Route;
        params: ExtractType<ArrayElement<T[K]['params']>> | undefined;
    };
};

export type RouterAppWithParams =
    | ArrayElement<AppWithParams<typeof routes>>
    | {
          app: 'unknown';
          params: undefined;
          route: undefined;
      };

export default [...routes] as Route[];
