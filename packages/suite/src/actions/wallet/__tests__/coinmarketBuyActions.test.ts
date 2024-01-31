import { configureStore } from 'src/support/tests/configureStore';

import coinmarketReducer from 'src/reducers/wallet/coinmarketReducer';

import * as coinmarketBuyActions from '../coinmarketBuyActions';
import invityAPI from 'src/services/suite/invityAPI';
import { BuyTrade, BuyTradeQuoteRequest } from 'invity-api';

export const getInitialState = () => ({
    wallet: {
        coinmarket: coinmarketReducer(undefined, { type: 'foo' } as any),
    },
});

type State = ReturnType<typeof getInitialState>;

const mockStore = configureStore<State, any>();

const initStore = (state: State) => {
    const store = mockStore(state);
    store.subscribe(() => {
        const action = store.getActions().pop();
        const { coinmarket } = store.getState().wallet;
        store.getState().wallet = {
            coinmarket: coinmarketReducer(coinmarket, action),
        };
        // add action back to stack
        store.getActions().push(action);
    });
    return store;
};

const setFetchMock = (mock: any) => {
    global.fetch = jest.fn().mockImplementation(() => {
        const p = new Promise(resolve => {
            resolve({
                ok: mock.ok,
                statusText: mock.statusText || '',
                json: () =>
                    new Promise((resolve, reject) => {
                        if (mock.reject) {
                            return reject(mock.reject);
                        }
                        return resolve(mock.response);
                    }),
            });
        });

        return p;
    });
};

describe('Coinmarket Buy Actions', () => {
    invityAPI.createInvityAPIKey('mock');

    it('load and saveBuyInfo', () => {
        const buyList = {
            country: 'CZ',
            suggestedFiatCurrency: 'CZK',
            providers: [
                {
                    name: 'simplecoin-sandbox',
                    companyName: 'Simplecoin',
                    logo: 'simplecoin-sandbox-icon.jpg',
                    isActive: true,
                    tradedCoins: ['BCH', 'ETH', 'LTC', 'XRP', 'ZEC'],
                    tradedFiatCurrencies: ['EUR', 'USD', 'CZK', 'PLN'],
                    supportedCountries: ['CZ', 'SK', 'DE'],
                    paymentMethods: ['bankTransfer'],
                    supportUrl: 'https://client.dev.simplecoin.eu/',
                },
                {
                    name: 'mercuryo-sandbox',
                    companyName: 'Mercuryo',
                    logo: 'mercuryo-sandbox-icon.png',
                    isActive: true,
                    tradedCoins: ['BAT', 'BCH', 'BTC', 'DAI', 'ETH', 'TRX', 'USDT20'],
                    tradedFiatCurrencies: ['EUR', 'GBP', 'RUB', 'USD'],
                    supportedCountries: [],
                    paymentMethods: ['creditCard'],
                    statusUrl: 'https://my.mercuryo.io/login',
                    supportUrl: 'https://intercom.help/mercuryo/en/collections/1549864-help',
                },
            ],
        };
        setFetchMock({ ok: true, response: buyList });

        const store = initStore(getInitialState());

        coinmarketBuyActions.loadBuyInfo().then(buyInfo => {
            store.dispatch(coinmarketBuyActions.saveBuyInfo(buyInfo));
            expect(store.getState().wallet.coinmarket.buy.buyInfo).toEqual({
                buyInfo: {
                    country: 'CZ',
                    providers: [
                        {
                            companyName: 'Simplecoin',
                            isActive: true,
                            logo: 'simplecoin-sandbox-icon.jpg',
                            name: 'simplecoin-sandbox',
                            paymentMethods: ['bankTransfer'],
                            supportUrl: 'https://client.dev.simplecoin.eu/',
                            supportedCountries: ['CZ', 'SK', 'DE'],
                            tradedCoins: ['BCH', 'ETH', 'LTC', 'XRP', 'ZEC'],
                            tradedFiatCurrencies: ['EUR', 'USD', 'CZK', 'PLN'],
                        },
                        {
                            companyName: 'Mercuryo',
                            isActive: true,
                            logo: 'mercuryo-sandbox-icon.png',
                            name: 'mercuryo-sandbox',
                            paymentMethods: ['creditCard'],
                            statusUrl: 'https://my.mercuryo.io/login',
                            supportUrl:
                                'https://intercom.help/mercuryo/en/collections/1549864-help',
                            supportedCountries: [],
                            tradedCoins: ['BAT', 'BCH', 'BTC', 'DAI', 'ETH', 'TRX', 'USDT20'],
                            tradedFiatCurrencies: ['EUR', 'GBP', 'RUB', 'USD'],
                        },
                    ],
                    suggestedFiatCurrency: 'CZK',
                },
                providerInfos: {
                    'mercuryo-sandbox': {
                        companyName: 'Mercuryo',
                        isActive: true,
                        logo: 'mercuryo-sandbox-icon.png',
                        name: 'mercuryo-sandbox',
                        paymentMethods: ['creditCard'],
                        statusUrl: 'https://my.mercuryo.io/login',
                        supportUrl: 'https://intercom.help/mercuryo/en/collections/1549864-help',
                        supportedCountries: [],
                        tradedCoins: ['BAT', 'BCH', 'BTC', 'DAI', 'ETH', 'TRX', 'USDT20'],
                        tradedFiatCurrencies: ['EUR', 'GBP', 'RUB', 'USD'],
                    },
                    'simplecoin-sandbox': {
                        companyName: 'Simplecoin',
                        isActive: true,
                        logo: 'simplecoin-sandbox-icon.jpg',
                        name: 'simplecoin-sandbox',
                        paymentMethods: ['bankTransfer'],
                        supportUrl: 'https://client.dev.simplecoin.eu/',
                        supportedCountries: ['CZ', 'SK', 'DE'],
                        tradedCoins: ['BCH', 'ETH', 'LTC', 'XRP', 'ZEC'],
                        tradedFiatCurrencies: ['EUR', 'USD', 'CZK', 'PLN'],
                    },
                },
                supportedCryptoCurrencies: new Set([
                    'BCH',
                    'ETH',
                    'LTC',
                    'XRP',
                    'ZEC',
                    'BAT',
                    'BTC',
                    'DAI',
                    'TRX',
                    'USDT20',
                ]),
                supportedFiatCurrencies: new Set(['eur', 'usd', 'czk', 'pln', 'gbp', 'rub']),
            });
        });
    });

    it('setIsFromRedirect', () => {
        const store = initStore(getInitialState());
        store.dispatch(coinmarketBuyActions.setIsFromRedirect(true));
        expect(store.getState().wallet.coinmarket.buy.isFromRedirect).toEqual(true);
    });

    it('saveQuoteRequest', () => {
        const store = initStore(getInitialState());

        const request: BuyTradeQuoteRequest = {
            fiatCurrency: 'EUR',
            receiveCurrency: 'BTC',
            wantCrypto: false,
            country: 'CZ',
            fiatStringAmount: '1',
        };

        store.dispatch(coinmarketBuyActions.saveQuoteRequest(request));
        expect(store.getState().wallet.coinmarket.buy.quotesRequest).toEqual(request);
    });

    it('saveTransactionDetailId', () => {
        const store = initStore(getInitialState());
        store.dispatch(coinmarketBuyActions.saveTransactionDetailId('1234-4321-4321'));
        expect(store.getState().wallet.coinmarket.buy.transactionId).toEqual('1234-4321-4321');
    });

    it('saveQuotes', () => {
        const store = initStore(getInitialState());

        const quotes: BuyTrade[] = [
            {
                fiatStringAmount: '10',
                fiatCurrency: 'EUR',
                receiveCurrency: 'BTC',
                receiveStringAmount: '0.0005',
                rate: 20000,
                quoteId: 'fc12d4c4-9078-4175-becd-90fc58a3145c',
                error: 'Amount too low, minimum is EUR 25 or BTC 0.002.',
                exchange: 'cexdirect',
                minFiat: 25,
                maxFiat: 1000,
                minCrypto: 0.002,
                maxCrypto: 0.10532,
                paymentMethod: 'creditCard',
                paymentId: 'e709df77-ee9e-4d12-98c2-84004a19c546',
            },
            {
                fiatStringAmount: '10',
                fiatCurrency: 'EUR',
                receiveCurrency: 'BTC',
                receiveStringAmount: '0.0010001683607972866',
                rate: 9998.316675433,
                quoteId: 'ff259797-6cbe-4fea-8330-5181353f64a0',
                exchange: 'mercuryo',
                minFiat: 20,
                maxFiat: 1999.96,
                minCrypto: 0.002,
                maxCrypto: 0.20003,
                paymentMethod: 'creditCard',
                paymentId: 'e709df77-ee9e-4d12-98c2-84004a19c548',
            },
        ];
        const alternativeQuotes: BuyTrade[] = [];

        store.dispatch(coinmarketBuyActions.saveQuotes(quotes, alternativeQuotes));
        expect(store.getState().wallet.coinmarket.buy.quotes).toEqual(quotes);
        expect(store.getState().wallet.coinmarket.buy.alternativeQuotes).toEqual(alternativeQuotes);
    });
});
