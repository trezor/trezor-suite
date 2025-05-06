import { RouterState } from 'src/reducers/suite/routerReducer';

const TRADING_BUY_ROUTE = {
    anchor: undefined,
    app: 'wallet',
    hash: '/btc/0/normal',
    loaded: true,
    params: { symbol: 'btc', accountIndex: 0, accountType: 'normal' },
    pathname: '/accounts/coinmarket/buy',
    route: {
        name: 'wallet-trading-buy',
        pattern: '/accounts/coinmarket/buy',
        app: 'wallet',
    },
    settingsBackRoute: { name: 'wallet-index', params: undefined },
    url: '/accounts/coinmarket/buy#/btc/0/normal',
} as RouterState;

const TRADING_SELL_ROUTE = {
    anchor: undefined,
    app: 'wallet',
    hash: '/btc/0/normal',
    loaded: true,
    params: { symbol: 'btc', accountIndex: 0, accountType: 'normal' },
    pathname: '/accounts/coinmarket/sell',
    route: {
        name: 'wallet-trading-sell',
        pattern: '/accounts/coinmarket/sell',
        app: 'wallet',
    },
    settingsBackRoute: { name: 'wallet-index', params: undefined },
    url: '/accounts/coinmarket/sell#/btc/0/normal',
} as RouterState;

const TRADING_EXCHANGE_ROUTE = {
    anchor: undefined,
    app: 'wallet',
    hash: '/btc/0/normal',
    loaded: true,
    params: { symbol: 'btc', accountIndex: 0, accountType: 'normal' },
    pathname: '/accounts/coinmarket/exchange',
    route: {
        name: 'wallet-trading-exchange',
        pattern: '/accounts/coinmarket/exchange',
        app: 'wallet',
    },
    settingsBackRoute: { name: 'wallet-index', params: undefined },
    url: '/accounts/coinmarket/exchange#/btc/0/normal',
} as RouterState;

const DEFAULT_ROUTE = {
    loaded: false,
    url: '/',
    pathname: '/',
    app: 'unknown',
    route: undefined,
    params: undefined,
    settingsBackRoute: {
        name: 'suite-index',
    },
} as RouterState;

export const tradingMiddlewareFixtures = {
    TRADING_BUY_ROUTE,
    TRADING_SELL_ROUTE,
    TRADING_EXCHANGE_ROUTE,
    DEFAULT_ROUTE,
};
