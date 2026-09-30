import { type BuyTrade, type BuyTradeQuoteRequest, type CryptoId } from 'invity-api';

import { mockGetHttpReceiverAddress } from '@suite/desktop-app-api/mocks';
import { createTestCompositionRoot } from '@suite-common/test-utils';
import { type TokenDefinitionsState } from '@suite-common/token-definitions';
import { initialState as tradingInitialState } from '@suite-common/trading';
import { asNetworkSymbol } from '@suite-common/wallet-config';
import { type Account, asAccountDescriptor } from '@suite-common/wallet-types';
import { mockWalletAccount } from '@suite-common/wallet-types/mocks';
import { mockAnalytics } from '@trezor/analytics-uploader/mocks';
import type { StaticSessionId } from '@trezor/connect';

import {
    type SelectBuyQuoteThunkDeps,
    type SelectBuyQuoteThunkState,
    selectBuyQuoteThunk,
} from './selectBuyQuoteThunk';

const mockSelectQuoteThunk = jest.fn((args: unknown) =>
    Object.assign(
        (dispatch: (action: { type: string }) => void) => {
            dispatch({ type: '@test/buy-select-quote' });

            return Promise.resolve();
        },
        { args },
    ),
);

jest.mock('@suite-common/trading', () => ({
    ...jest.requireActual('@suite-common/trading'),
    buyThunks: {
        ...jest.requireActual('@suite-common/trading').buyThunks,
        selectQuoteThunk: (args: unknown) => mockSelectQuoteThunk(args),
    },
}));

const DEVICE_STATE: StaticSessionId = '1stTestnetAddress@device_id:0';

type FixtureState = {
    device: { selectedDevice: { state: { staticSessionId: StaticSessionId } } };
    tokenDefinitions: Partial<TokenDefinitionsState>;
    wallet: {
        accounts: Account[];
        trading: {
            info: { coins: Record<string, { name: string; symbol: string }> };
            buy: {
                receiveAddress: string;
                quotesRequest?: BuyTradeQuoteRequest;
                buyInfo: {
                    buyInfo: { defaultAmountsOfFiatCurrencies: Record<string, never> };
                    providerInfos: Record<string, { companyName: string }>;
                    supportedCryptoCurrencies: CryptoId[];
                    supportedFiatCurrencies: never[];
                };
            };
        };
    };
};

const ACCOUNT: Account = mockWalletAccount({
    symbol: asNetworkSymbol('eth'),
    descriptor: asAccountDescriptor('0xAccount'),
});

const QUOTE: BuyTrade = {
    exchange: 'testExchange',
    paymentMethod: 'creditCard',
    quoteId: 'quote-1',
    receiveCurrency: 'ethereum' as CryptoId,
};

const DEFAULT_QUOTES_REQUEST: BuyTradeQuoteRequest = {
    wantCrypto: false,
    fiatCurrency: 'EUR',
    fiatStringAmount: '100',
    receiveCurrency: 'ethereum' as CryptoId,
    country: 'CZ',
    paymentMethod: 'bankTransfer',
};

const buildState = (
    { quotesRequest }: { quotesRequest?: BuyTradeQuoteRequest } = {
        quotesRequest: DEFAULT_QUOTES_REQUEST,
    },
): FixtureState => ({
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
            buy: {
                ...tradingInitialState.buy,
                receiveAddress: '0xReceiveAddress',
                quotesRequest,
                buyInfo: {
                    buyInfo: { defaultAmountsOfFiatCurrencies: {} },
                    providerInfos: { testExchange: { companyName: 'Test Exchange' } },
                    supportedCryptoCurrencies: [],
                    supportedFiatCurrencies: [],
                },
            },
        },
    },
});

const initStore = (report: jest.Mock, preloadedState: FixtureState) =>
    createTestCompositionRoot<SelectBuyQuoteThunkDeps, SelectBuyQuoteThunkState>({
        preloadedState,
        services: () => ({
            desktopApi: { getHttpReceiverAddress: mockGetHttpReceiverAddress() },
            analytics: mockAnalytics(report),
            suiteRouterHistory: {
                getLocation: jest.fn(),
                navigate: jest.fn(),
                listen: jest.fn(() => jest.fn()),
            },
        }),
    }).services.store;

describe('selectBuyQuoteThunk', () => {
    beforeEach(() => {
        mockSelectQuoteThunk.mockClear();
    });

    it('reports analytics derived from the redux quotesRequest, not form values', async () => {
        const report = jest.fn();
        const store = initStore(report, buildState());

        await store.dispatch(selectBuyQuoteThunk({ quote: QUOTE }));

        expect(report).toHaveBeenCalledWith(
            expect.objectContaining({
                payload: expect.objectContaining({
                    action: 'continue',
                    step: 'buy-form',
                    cryptoLabel: 'Ethereum',
                    cryptoNetworkSymbol: 'eth',
                    cryptoContractAddress: undefined,
                    exchangeName: 'testExchange',
                    paymentMethod: 'creditCard',
                    countryOfResidence: 'CZ',
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
        const store = initStore(report, buildState({ quotesRequest: undefined }));

        await store.dispatch(selectBuyQuoteThunk({ quote: QUOTE }));

        expect(report).not.toHaveBeenCalled();
        expect(mockSelectQuoteThunk).not.toHaveBeenCalled();
    });
});
