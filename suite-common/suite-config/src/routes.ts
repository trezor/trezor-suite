// Steps to add route params:
// 1. add params order here (example: wallet or suite-bridge)
// 2. go to `packages/suite/src/utils/suite/router.ts` and create params validation function (example: validateWalletParams or validateModalAppParams)
// 3. implement validation function in @suite-utils/router:getAppWithParams
// 4. add params types to RouteParamsTypes (`packages/suite/src/constants/suite/routes.ts`)

export const walletParams = ['symbol', 'accountIndex', 'accountType'] as const;
export const modalAppParams = ['cancelable', 'variant'] as const;
export const dashboardParams = ['modal', 'networkSymbol'] as const;
export const earnParams = [
    'symbol',
    'accountIndex',
    'accountType',
    'yieldId',
    'contractAddress',
] as const;

export const routes = [
    {
        name: 'suite-start',
        pattern: '/start',
        app: 'start',
        isFullscreenApp: true,
        isForegroundApp: true,
        clearUrl: true,
    },
    {
        name: 'suite-index',
        pattern: '/',
        app: 'dashboard',
        params: dashboardParams,
    },
    {
        name: 'suite-earn',
        pattern: '/earn',
        app: 'earn',
    },
    {
        name: 'earn-supply',
        pattern: '/earn/supply',
        app: 'earn',
        params: earnParams,
    },
    {
        name: 'earn-withdraw',
        pattern: '/earn/withdraw',
        app: 'earn',
        params: earnParams,
    },
    {
        name: 'suite-version',
        pattern: '/version',
        app: 'version',
        isForegroundApp: true,
        params: modalAppParams,
    },
    {
        name: 'suite-bridge-requested',
        pattern: '/bridge-requested',
        app: 'bridge-requested',
        isForegroundApp: true,
        params: modalAppParams,
    },
    {
        name: 'suite-bridge',
        pattern: '/bridge',
        app: 'bridge',
        isForegroundApp: true,
        params: modalAppParams,
    },
    {
        name: 'suite-bridge-deprecated',
        pattern: '/bridge-deprecated',
        app: 'bridge-deprecated',
        isForegroundApp: true,
        params: modalAppParams,
    },
    {
        name: 'suite-connect-popup',
        pattern: '/connect-popup',
        app: 'connect-popup',
        params: modalAppParams,
    },
    {
        name: 'suite-udev',
        pattern: '/udev',
        app: 'udev',
        isForegroundApp: true,
        params: modalAppParams,
    },
    {
        name: 'suite-switch-device',
        pattern: '/switch-device',
        app: 'switch-device',
        isForegroundApp: true,
        params: modalAppParams,
    },
    {
        name: 'onboarding-index',
        pattern: '/onboarding',
        app: 'onboarding',
        isForegroundApp: true,
        isFullscreenApp: true,
    },
    {
        name: 'password-manager-index',
        pattern: '/password-manager',
        app: 'password-manager',
    },
    {
        name: 'settings-index',
        pattern: '/settings',
        app: 'settings',
        params: undefined,
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
        name: 'settings-connected-apps',
        pattern: '/settings/connected-apps',
        app: 'settings',
    },
    {
        name: 'recovery-index',
        pattern: '/recovery',
        app: 'recovery',
        isForegroundApp: true,
        params: modalAppParams,
    },
    {
        name: 'backup-index',
        pattern: '/backup',
        app: 'backup',
        isForegroundApp: true,
        params: modalAppParams,
    },
    {
        name: 'firmware-index',
        pattern: '/firmware',
        app: 'firmware',
        isForegroundApp: true,
        params: modalAppParams,
    },
    {
        name: 'firmware-type',
        pattern: '/firmware-type',
        app: 'firmware-type',
        isForegroundApp: true,
        params: modalAppParams,
    },
    {
        name: 'firmware-custom',
        pattern: '/firmware-custom',
        app: 'firmware-custom',
        isForegroundApp: true,
        params: modalAppParams,
    },
    {
        name: 'create-multi-share-backup',
        pattern: '/create-multi-share-backup',
        app: 'create-multi-share-backup',
        isForegroundApp: true,
        params: modalAppParams,
    },
    {
        name: 'wallet-index',
        pattern: '/accounts',
        app: 'wallet',
        params: walletParams,
    },
    {
        name: 'wallet-send',
        pattern: '/accounts/send',
        app: 'wallet',
        params: walletParams,
    },
    {
        name: 'wallet-staking',
        pattern: '/accounts/staking',
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
        name: 'wallet-trading-buy',
        pattern: '/accounts/coinmarket/buy',
        app: 'wallet',
    },
    {
        name: 'wallet-trading-exchange',
        pattern: '/accounts/coinmarket/exchange',
        app: 'wallet',
    },
    {
        name: 'wallet-trading-sell',
        pattern: '/accounts/coinmarket/sell',
        app: 'wallet',
    },
    {
        name: 'wallet-trading-buy-offers',
        pattern: '/accounts/coinmarket/buy/offers',
        app: 'wallet',
    },
    {
        name: 'wallet-trading-sell-offers',
        pattern: '/accounts/coinmarket/sell/offers',
        app: 'wallet',
    },
    {
        name: 'wallet-trading-exchange-offers',
        pattern: '/accounts/coinmarket/exchange/offers',
        app: 'wallet',
    },
    {
        name: 'wallet-trading-buy-detail',
        pattern: '/accounts/coinmarket/buy/detail',
        app: 'wallet',
    },
    {
        name: 'wallet-trading-sell-detail',
        pattern: '/accounts/coinmarket/sell/detail',
        app: 'wallet',
    },
    {
        name: 'wallet-trading-exchange-detail',
        pattern: '/accounts/coinmarket/exchange/detail',
        app: 'wallet',
    },
    {
        name: 'wallet-trading-buy-confirm',
        pattern: '/accounts/coinmarket/buy/confirm',
        app: 'wallet',
    },
    {
        name: 'wallet-trading-sell-confirm',
        pattern: '/accounts/coinmarket/sell/confirm',
        app: 'wallet',
    },
    {
        name: 'wallet-trading-exchange-confirm',
        pattern: '/accounts/coinmarket/exchange/confirm',
        app: 'wallet',
    },
    {
        name: 'wallet-trading-redirect',
        pattern: '/coinmarket-redirect',
        app: 'wallet',
        params: walletParams,
    },
    {
        name: 'wallet-trading-transactions',
        pattern: '/accounts/coinmarket/transactions',
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
        name: 'wallet-tokens',
        pattern: '/accounts/tokens',
        app: 'wallet',
        params: walletParams,
        hasNestedRoutes: true,
    },
    {
        name: 'wallet-tokens-hidden',
        pattern: '/accounts/tokens/hidden',
        app: 'wallet',
        params: walletParams,
        isNestedRoute: true,
    },
    {
        name: 'wallet-tokens-inactive',
        pattern: '/accounts/tokens/inactive',
        app: 'wallet',
        params: walletParams,
        isNestedRoute: true,
    },
    {
        name: 'wallet-nfts',
        pattern: '/accounts/nfts',
        app: 'wallet',
        params: walletParams,
        hasNestedRoutes: true,
    },
    {
        name: 'wallet-nfts-hidden',
        pattern: '/accounts/nfts/hidden',
        app: 'wallet',
        params: walletParams,
        isNestedRoute: true,
    },

    {
        name: 'wallet-anonymize',
        pattern: '/accounts/anonymize',
        app: 'wallet',
        params: walletParams,
    },
    {
        name: 'notifications-index',
        pattern: '/notifications',
        app: 'notifications',
    },
] as const;
