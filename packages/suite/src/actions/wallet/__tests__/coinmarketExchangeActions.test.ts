import configureStore from 'redux-mock-store';
import thunk from 'redux-thunk';
import coinmarketReducer from '@wallet-reducers/coinmarketReducer';

import * as coinmarketExchangeActions from '../coinmarketExchangeActions';
import invityAPI from '@suite-services/invityAPI';
import { ExchangeTrade, ExchangeTradeQuoteRequest } from 'invity-api';

export const getInitialState = () => ({
    wallet: {
        coinmarket: coinmarketReducer(undefined, { type: 'foo' } as any),
    },
});

type State = ReturnType<typeof getInitialState>;

const mockStore = configureStore<State, any>([thunk]);

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
    // @ts-ignore
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

describe('Coinmarket Exchange Actions', () => {
    invityAPI.createInvityAPIKey('mock');

    it('load and saveExchangeInfo', async () => {
        const exchangeList = [
            {
                name: 'changenow',
                companyName: 'ChangeNOW',
                logo: 'changenow-icon.jpg',
                isActive: true,
                isFixedRate: false,
                buyTickers: ['XMR', 'BTC'],
                sellTickers: ['BTC'],
                addressFormats: {
                    BCH: 'legacy',
                    LTC: 'type3',
                },
                statusUrl: 'https://changenow.io/exchange/txs/{{orderId}}',
                kycUrl: 'https://changenow.io/faq#kyc',
                supportUrl: 'https://support.changenow.io',
                kycPolicy:
                    'Changenow enforces KYC on suspicious transactions. Refunds without KYC.',
                isRefundRequired: false,
            },
            {
                name: 'changenowfr',
                companyName: 'ChangeNOW',
                logo: 'changenowfr-icon.jpg',
                isActive: true,
                isFixedRate: true,
                buyTickers: ['ETH', 'BTC'],
                sellTickers: ['ETH', 'BTC'],
                addressFormats: {
                    BCH: 'legacy',
                    LTC: 'type3',
                },
                statusUrl: 'https://changenow.io/exchange/txs/{{orderId}}',
                kycUrl: 'https://changenow.io/faq#kyc',
                supportUrl: 'https://support.changenow.io',
                kycPolicy:
                    'Changenow enforces KYC on suspicious transactions. Refunds without KYC.',
                isRefundRequired: false,
            },
        ];

        setFetchMock({ ok: true, response: exchangeList });

        const store = initStore(getInitialState());

        coinmarketExchangeActions.loadExchangeInfo().then(exchangeInfo => {
            store.dispatch(coinmarketExchangeActions.saveExchangeInfo(exchangeInfo));
            expect(store.getState().wallet.coinmarket.exchange.exchangeInfo).toEqual({
                exchangeList,
                providerInfos: { changenow: exchangeList[0], changenowfr: exchangeList[1] },
                buySymbols: new Set<string>(['xmr', 'btc', 'eth']),
                sellSymbols: new Set<string>(['btc', 'eth']),
            });
        });
    });

    it('saveTransactionDetailId', async () => {
        const store = initStore(getInitialState());
        store.dispatch(coinmarketExchangeActions.saveTransactionId('1234-4321-4321'));
        expect(store.getState().wallet.coinmarket.exchange.transactionId).toEqual('1234-4321-4321');
    });

    it('saveQuoteRequest', async () => {
        const store = initStore(getInitialState());

        const request: ExchangeTradeQuoteRequest = {
            receive: 'BTC',
            send: 'LTC',
            sendStringAmount: '12',
        };

        store.dispatch(coinmarketExchangeActions.saveQuoteRequest(request));
        expect(store.getState().wallet.coinmarket.exchange.quotesRequest).toEqual(request);
    });

    it('saveQuotes', async () => {
        const store = initStore(getInitialState());

        const fixedQuotes: ExchangeTrade[] = [];
        const floatQuotes: ExchangeTrade[] = [];

        store.dispatch(coinmarketExchangeActions.saveQuotes(fixedQuotes, floatQuotes));
        expect(store.getState().wallet.coinmarket.exchange.fixedQuotes).toEqual(fixedQuotes);
        expect(store.getState().wallet.coinmarket.exchange.floatQuotes).toEqual(floatQuotes);
    });
});
