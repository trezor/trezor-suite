import { type CryptoId, type ExchangeTrade, type ExchangeTradeQuoteRequest } from 'invity-api';

import { type DesktopAnalyticsDep } from '@suite/analytics';
import { type GotoThunkDeps } from '@suite/router';
import { type WithServices } from '@suite-common/redux-utils';
import { configureMockStore } from '@suite-common/test-utils';
import { initialState as tradingInitialState } from '@suite-common/trading';
import { asNetworkSymbol } from '@suite-common/wallet-config';
import { type Account, asAccountDescriptor } from '@suite-common/wallet-types';
import { mockWalletAccount } from '@suite-common/wallet-types/mocks';
import { mockAnalytics } from '@trezor/analytics-uploader/mocks';
import type { StaticSessionId } from '@trezor/connect';

import { selectExchangeQuoteThunk } from './selectExchangeQuoteThunk';

const mockSelectQuoteThunk = jest.fn((args: unknown) =>
    Object.assign(
        (dispatch: (action: { type: string }) => void) => {
            dispatch({ type: '@test/exchange-select-quote' });

            return Promise.resolve();
        },
        { args },
    ),
);

jest.mock('@suite-common/trading', () => ({
    ...jest.requireActual('@suite-common/trading'),
    exchangeThunks: {
        ...jest.requireActual('@suite-common/trading').exchangeThunks,
        selectQuoteThunk: (args: unknown) => mockSelectQuoteThunk(args),
    },
}));

const DEVICE_STATE: StaticSessionId = '1stTestnetAddress@device_id:0';

type SelectExchangeQuoteThunkDeps = GotoThunkDeps & WithServices<DesktopAnalyticsDep>;

const createExtra = (report: jest.Mock): SelectExchangeQuoteThunkDeps => ({
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

const QUOTE: ExchangeTrade = {
    exchange: 'testExchange',
    quoteId: 'quote-1',
    send: 'ethereum' as CryptoId,
    receive: 'bitcoin' as CryptoId,
    sendStringAmount: '1',
};

const DEFAULT_QUOTES_REQUEST: ExchangeTradeQuoteRequest = {
    send: 'ethereum' as CryptoId,
    receive: 'bitcoin' as CryptoId,
    sendStringAmount: '1',
};

const buildStore = (
    report: jest.Mock,
    { quotesRequest }: { quotesRequest?: ExchangeTradeQuoteRequest } = {
        quotesRequest: DEFAULT_QUOTES_REQUEST,
    },
) =>
    configureMockStore({
        extra: createExtra(report),
        preloadedState: {
            device: { selectedDevice: { state: { staticSessionId: DEVICE_STATE } } },
            tokenDefinitions: {},
            wallet: {
                accounts: [ACCOUNT],
                trading: {
                    ...tradingInitialState,
                    info: {
                        ...tradingInitialState.info,
                        coins: {
                            ethereum: { name: 'Ethereum', symbol: 'eth' },
                            bitcoin: { name: 'Bitcoin', symbol: 'btc' },
                        },
                    },
                    exchange: {
                        ...tradingInitialState.exchange,
                        exchangeInfo: {
                            providerInfos: { testExchange: { companyName: 'Test Exchange' } },
                        },
                        quotesRequest,
                    },
                },
            },
        },
    });

describe('selectExchangeQuoteThunk', () => {
    beforeEach(() => {
        mockSelectQuoteThunk.mockClear();
    });

    it('reports analytics derived from the redux quotesRequest and the fraction button', async () => {
        const report = jest.fn();
        const store = buildStore(report);

        await store.dispatch(
            selectExchangeQuoteThunk({
                quote: QUOTE,
                exchangeType: 'CEX',
                rateType: 'fixed',
                fractionButton: 4,
            }),
        );

        expect(report).toHaveBeenCalledWith(
            expect.objectContaining({
                payload: expect.objectContaining({
                    action: 'continue',
                    step: 'exchange-form',
                    sendCryptoLabel: 'ETH',
                    sendCryptoNetworkSymbol: 'eth',
                    sendCryptoContractAddress: undefined,
                    receiveCryptoLabel: 'BTC',
                    receiveCryptoNetworkSymbol: 'btc',
                    receiveCryptoContractAddress: undefined,
                    exchangeType: 'CEX',
                    exchangeName: 'Test Exchange',
                    rateType: 'fixed',
                    fractionButton: '25%',
                }),
            }),
        );
        expect(mockSelectQuoteThunk).toHaveBeenCalledTimes(1);
        expect(mockSelectQuoteThunk).toHaveBeenCalledWith(
            expect.objectContaining({ quote: QUOTE }),
        );
    });

    it('returns early without reporting analytics when the quotes request is missing', async () => {
        const report = jest.fn();
        const store = buildStore(report, { quotesRequest: undefined });

        await store.dispatch(selectExchangeQuoteThunk({ quote: QUOTE }));

        expect(report).not.toHaveBeenCalled();
        expect(mockSelectQuoteThunk).not.toHaveBeenCalled();
    });
});
