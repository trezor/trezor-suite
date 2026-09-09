import { type CryptoId, type SellFiatTrade, type SellFiatTradeQuoteRequest } from 'invity-api';

import { type DesktopAnalyticsDep } from '@suite/analytics';
import { locksReducer } from '@suite/locks';
import { modalReducer } from '@suite/modal';
import { type GotoThunkDeps, routerLocationChange, routerReducer } from '@suite/router';
import { type WithServices } from '@suite-common/redux-utils';
import { createTestStore } from '@suite-common/test-utils';
import { initialState as tradingInitialState } from '@suite-common/trading';
import { asNetworkSymbol } from '@suite-common/wallet-config';
import { type Account, asAccountDescriptor } from '@suite-common/wallet-types';
import { mockWalletAccount } from '@suite-common/wallet-types/mocks';
import { mockAnalytics } from '@trezor/analytics-uploader/mocks';
import type { StaticSessionId } from '@trezor/connect';

import { selectSellQuoteThunk } from './selectSellQuoteThunk';

const mockRequestSellTradeThunk = jest.fn((args: unknown) =>
    Object.assign(
        (dispatch: (action: { type: string }) => void) => {
            dispatch({ type: '@test/request-sell-trade' });

            return Promise.resolve({ isRedirecting: false, args });
        },
        { args },
    ),
);

jest.mock('./requestSellTradeThunk', () => ({
    requestSellTradeThunk: (args: unknown) => mockRequestSellTradeThunk(args),
}));

const DEVICE_STATE: StaticSessionId = '1stTestnetAddress@device_id:0';

type SelectSellQuoteThunkDeps = GotoThunkDeps & WithServices<DesktopAnalyticsDep>;

const createExtra = (report: jest.Mock): SelectSellQuoteThunkDeps => ({
    services: {
        analytics: mockAnalytics(report),
        suiteRouterHistory: {
            getLocation: jest.fn(),
            navigate: jest.fn(),
            listen: jest.fn(() => jest.fn()),
        },
    },
});

const ACCOUNT: Account = mockWalletAccount({
    symbol: asNetworkSymbol('eth'),
    descriptor: asAccountDescriptor('0xAccount'),
});

const QUOTE: SellFiatTrade = {
    exchange: 'testExchange',
    quoteId: 'quote-1',
    paymentMethod: 'bankTransfer',
    cryptoCurrency: 'ethereum' as CryptoId,
};

const DEFAULT_QUOTES_REQUEST: SellFiatTradeQuoteRequest = {
    country: 'CZ',
    fiatCurrency: 'EUR',
    cryptoCurrency: 'ethereum' as CryptoId,
    amountInCrypto: false,
};

const buildStore = (
    report: jest.Mock,
    { quotesRequest }: { quotesRequest?: SellFiatTradeQuoteRequest } = {
        quotesRequest: DEFAULT_QUOTES_REQUEST,
    },
) =>
    createTestStore({
        extra: createExtra(report),
        preloadedState: {
            locks: locksReducer(undefined, { type: 'test-init' }),
            modal: modalReducer(undefined, { type: 'test-init' }),
            router: routerReducer(undefined, { type: 'test-init' }),
            device: { selectedDevice: { state: { staticSessionId: DEVICE_STATE } } },
            tokenDefinitions: {},
            wallet: {
                accounts: [ACCOUNT],
                trading: {
                    ...tradingInitialState,
                    info: {
                        ...tradingInitialState.info,
                        coins: { ethereum: { name: 'Ethereum', symbol: 'eth' } },
                    },
                    sell: {
                        ...tradingInitialState.sell,
                        sellInfo: {
                            providerInfos: { testExchange: { flow: 'DEFAULT' } },
                        },
                        quotesRequest,
                    },
                },
            },
        },
    });

describe('selectSellQuoteThunk', () => {
    beforeEach(() => {
        mockRequestSellTradeThunk.mockClear();
    });

    it('reports analytics derived from the redux quotesRequest and the fraction button', async () => {
        const report = jest.fn();
        const store = buildStore(report);

        await store.dispatch(selectSellQuoteThunk({ quote: QUOTE, fractionButton: 4 }));

        expect(report).toHaveBeenCalledWith(
            expect.objectContaining({
                payload: expect.objectContaining({
                    action: 'continue',
                    step: 'sell-form',
                    cryptoLabel: 'ETH',
                    cryptoNetworkSymbol: 'eth',
                    cryptoContractAddress: undefined,
                    exchangeName: 'testExchange',
                    receiveMethod: 'bankTransfer',
                    countryOfResidence: 'CZ',
                    fractionButton: '25%',
                }),
            }),
        );
    });

    it('returns early without reporting analytics when the quotes request is missing', async () => {
        const report = jest.fn();
        const store = buildStore(report, { quotesRequest: undefined });

        await store.dispatch(selectSellQuoteThunk({ quote: QUOTE, fractionButton: 4 }));

        expect(report).not.toHaveBeenCalled();
    });

    it('navigates to sell confirm before starting the partner request flow', async () => {
        const report = jest.fn();
        const store = buildStore(report, {
            quotesRequest: { ...DEFAULT_QUOTES_REQUEST, amountInCrypto: true },
        });

        await store.dispatch(
            selectSellQuoteThunk({
                quote: {
                    ...QUOTE,
                    quoteId: undefined,
                },
                fractionButton: 4,
            }),
        );

        expect(mockRequestSellTradeThunk).toHaveBeenCalledTimes(1);
        expect(store.getActions()).toEqual(
            expect.arrayContaining([
                expect.objectContaining({
                    type: routerLocationChange.type,
                    payload: expect.objectContaining({
                        pathname: '/accounts/coinmarket/sell/confirm',
                    }),
                }),
                { type: '@test/request-sell-trade' },
            ]),
        );

        const gotoActionIndex = store
            .getActions()
            .findIndex(action => action.type === routerLocationChange.type);
        const requestActionIndex = store
            .getActions()
            .findIndex(action => action.type === '@test/request-sell-trade');

        expect(gotoActionIndex).toBeGreaterThanOrEqual(0);
        expect(requestActionIndex).toBeGreaterThan(gotoActionIndex);
    });
});
