import { createRouterStateMock, createRouterStateMockForRoute } from '@suite/router/mocks';
import { asNetworkSymbol } from '@suite-common/wallet-config';
import { type WalletParams } from '@suite-common/wallet-types';

const BTC_ACCOUNT_PARAMS: WalletParams = {
    symbol: asNetworkSymbol('btc'),
    accountIndex: 0,
    accountType: 'normal',
};

export const tradingMiddlewareFixtures = {
    TRADING_BUY_ROUTE: createRouterStateMockForRoute('wallet-trading-buy'),
    TRADING_SELL_ROUTE: createRouterStateMockForRoute('wallet-trading-sell'),
    TRADING_EXCHANGE_ROUTE: createRouterStateMockForRoute(
        'wallet-trading-exchange',
        BTC_ACCOUNT_PARAMS,
    ),
    TRADING_EXCHANGE_CONFIRM_ROUTE: createRouterStateMockForRoute(
        'wallet-trading-exchange-confirm',
        BTC_ACCOUNT_PARAMS,
    ),
    TRADING_REDIRECT_ROUTE: createRouterStateMockForRoute('wallet-trading-redirect'),
    WALLET_INDEX_ROUTE: createRouterStateMockForRoute('wallet-index', BTC_ACCOUNT_PARAMS),
    DEFAULT_ROUTE: createRouterStateMock(),
};
