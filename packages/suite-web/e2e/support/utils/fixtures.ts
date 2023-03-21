import { TestSavingsSetupStatus } from './types';

export const fixtures = {
    '/api/exchange/coins': '/invity/exchange/coins.json',
    '/api/exchange/list': '/invity/exchange/list.json',
    '/api/exchange/quotes': '/invity/exchange/quotes.json',
    '/api/exchange/trade': '/invity/exchange/trade.json',
    '/api/exchange/watch/0': '/invity/exchange/watch.json',
    '/api/buy/list': '/invity/buy/list.json',
    '/api/buy/quotes': '/invity/buy/quotes.json',
    '/api/buy/trade': '/invity/buy/trade.json',
    '/api/buy/watch/0': '/invity/buy/watch.json',
    '/api/sell/list': '/invity/sell/list.json',
    '/api/sell/fiat/quotes': '/invity/sell/quotes.json',
    '/api/sell/fiat/trade': '/invity/sell/trade.json',
    '/api/sell/fiat/watch/0': '/invity/sell/watch.json',
    '/api/savings/list': '/invity/savings/list.json',
};

export const btcdirectSavingsFixturesDictionary = {
    NoSavingsTrade: '/invity/savings/btcdirect/trade-no-savings-trade.json',
    SetSavingsParameters: '/invity/savings/btcdirect/trade-set-savings-parameters.json',
    ConfirmPaymentInfo: '/invity/savings/btcdirect/trade-confirm-payment-info.json',
    Active: '/invity/savings/btcdirect/trade-active.json',
};

export const swanSavingsFixturesDictionary = {
    SetSavingsParameters: '/invity/savings/swan/trade-set-savings-parameters.json',
    Active: '/invity/savings/swan/trade-active.json',
};

export const btcdirectSavingsFixtures = {
    '/api/savings/trezor/trade': (status: TestSavingsSetupStatus) =>
        btcdirectSavingsFixturesDictionary[status],
};

export const swanSavingsFixtures = {
    '/api/savings/trezor/trade': (status: TestSavingsSetupStatus) =>
        swanSavingsFixturesDictionary[status],
};
