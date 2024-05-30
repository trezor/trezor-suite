// Steps to add route params:
// 1. add params order here (example: wallet or suite-bridge)
// 2. go to @suite-utils/router and create params validation function (example: validateWalletParams or validateModalAppParams)
// 3. implement validation function in @suite-utils/router:getAppWithParams
// 4. add params types to RouteParamsTypes (@suite-constants/routes)

const walletParams = ['symbol', 'accountIndex', 'accountType'] as const;
const modalAppParams = ['cancelable', 'variant'] as const;

export const routes = [
    {
        name: 'suite-start',
        pattern: '/start',
        app: 'start',
        isFullscreenApp: true,
        isForegroundApp: true,
    },
    {
        name: 'suite-index',
        pattern: '/',
        app: 'dashboard',
        exact: true,
    },
    {
        name: 'suite-version',
        pattern: '/version',
        app: 'version',
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
        name: 'settings-index',
        pattern: '/settings',
        app: 'settings',
        params: undefined,
        exact: true,
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
        exact: true,
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
        name: 'wallet-coinmarket-buy',
        pattern: '/accounts/coinmarket/buy',
        app: 'wallet',
        params: walletParams,
        exact: true,
    },
    {
        name: 'wallet-coinmarket-exchange',
        pattern: '/accounts/coinmarket/exchange',
        app: 'wallet',
        params: walletParams,
        exact: true,
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
        exact: true,
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
        name: 'wallet-coinmarket-p2p',
        pattern: '/accounts/coinmarket/p2p',
        app: 'wallet',
        params: walletParams,
        exact: true,
    },
    {
        name: 'wallet-coinmarket-p2p-offers',
        pattern: '/accounts/coinmarket/p2p/offers',
        app: 'wallet',
        params: walletParams,
    },
    {
        name: 'wallet-coinmarket-savings-setup',
        pattern: '/accounts/coinmarket/savings/setup',
        app: 'wallet',
        params: walletParams,
        exact: true,
    },
    {
        name: 'wallet-coinmarket-savings-setup-continue',
        pattern: '/accounts/coinmarket/savings/setup/continue',
        app: 'wallet',
        params: walletParams,
        exact: true,
    },
    {
        name: 'wallet-coinmarket-savings-setup-waiting',
        pattern: '/accounts/coinmarket/savings/setup/waiting',
        app: 'wallet',
        params: walletParams,
        exact: true,
    },
    {
        name: 'wallet-coinmarket-savings-payment-info',
        pattern: '/accounts/coinmarket/savings/payment-info',
        app: 'wallet',
        params: walletParams,
        exact: true,
    },
    {
        name: 'wallet-coinmarket-savings-overview',
        pattern: '/accounts/coinmarket/savings/overview',
        app: 'wallet',
        params: walletParams,
        exact: true,
    },
    {
        name: 'wallet-coinmarket-redirect',
        pattern: '/coinmarket-redirect',
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
        name: 'wallet-tokens-coins',
        pattern: '/accounts/tokens/coins',
        app: 'wallet',
        params: walletParams,
    },
    {
        name: 'wallet-tokens-hidden',
        pattern: '/accounts/tokens/hidden',
        app: 'wallet',
        params: walletParams,
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
