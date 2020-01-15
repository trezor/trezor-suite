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
        name: 'tips-index',
        pattern: '/tips',
        app: 'wallet',
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
        name: 'settings-wallet',
        pattern: '/settings/wallet',
        app: 'settings',
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
] as const;

type RouteKeys = keyof ArrayElement<typeof routes> | 'isModal' | 'params';
export type Route = ArrayElement<ConstWithOptionalFields<typeof routes, RouteKeys>>;

type RouteParamsTypes = {
    symbol: Network['symbol'];
    accountIndex: number;
    accountType: NonNullable<Network['accountType']>;
    // cancelable: boolean;
    another: boolean;
};

type ExtractType<T extends any> = {
    [P in T]: RouteParamsTypes[P];
};

type AppWithParams<T extends { [key: string]: any }> = {
    [K in keyof T]: {
        app: T[K]['app'];
        route: Route;
        params:
            | (T[K]['params'] extends object
                  ? ExtractType<ArrayElement<T[K]['params']>>
                  : undefined)
            | undefined;
        // route: T[K];
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
