import {
    type CryptoId,
    type SellFiatFlowType,
    type SellFiatTrade,
    type SellFiatTradeQuoteRequest,
} from 'invity-api';

import { type DesktopAnalytics, type DesktopAnalyticsDep } from '@suite/analytics';
import { mockDesktopAnalytics } from '@suite/analytics/mocks';
import { locksReducer } from '@suite/locks';
import { modalReducer } from '@suite/modal';
import { type GotoThunkDeps, routerLocationChange, routerReducer } from '@suite/router';
import { mockSuiteRouterHistory } from '@suite/router/mocks';
import { createTestCompositionRoot } from '@suite-common/test-utils';
import { initialState as tradingInitialState, tradingSellActions } from '@suite-common/trading';
import { mockBankAccount } from '@suite-common/trading/mocks';
import { asNetworkSymbol } from '@suite-common/wallet-config';
import { type Account, asAccountDescriptor } from '@suite-common/wallet-types';
import { mockWalletAccount } from '@suite-common/wallet-types/mocks';
import type { StaticSessionId } from '@trezor/connect';
import { mock } from '@trezor/dependency-injection';
import { type WithServices } from '@trezor/redux-utils';

import { type SelectSellQuoteThunkState, selectSellQuoteThunk } from './selectSellQuoteThunk';

const DEVICE_STATE: StaticSessionId = '1stTestnetAddress@device_id:0';

type SelectSellQuoteThunkDeps = GotoThunkDeps & WithServices<DesktopAnalyticsDep>;

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

type BuildStoreParams = {
    quotesRequest?: SellFiatTradeQuoteRequest;
    flow?: SellFiatFlowType;
    report?: jest.MockedFunction<DesktopAnalytics['report']>;
};

const buildStore = (params: BuildStoreParams = {}) => {
    const quotesRequest = 'quotesRequest' in params ? params.quotesRequest : DEFAULT_QUOTES_REQUEST;
    const flow = params.flow ?? 'PAYMENT_GATE';

    return createTestCompositionRoot<SelectSellQuoteThunkDeps, SelectSellQuoteThunkState>({
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
                            providerInfos: { testExchange: { flow } },
                        },
                        quotesRequest,
                    },
                },
            },
        },
        services: () => ({
            analytics: mockDesktopAnalytics(params.report),
            suiteRouterHistory: mockSuiteRouterHistory(),
        }),
    }).services.store;
};

describe('selectSellQuoteThunk', () => {
    it('reports analytics derived from the redux quotesRequest and the fraction button', async () => {
        const report = mock<DesktopAnalytics['report']>();
        const store = buildStore({ report });

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

    it('opens the preview step for a payment gate provider', async () => {
        const store = buildStore({ flow: 'PAYMENT_GATE' });

        await store.dispatch(selectSellQuoteThunk({ quote: QUOTE }));

        expect(store.getActions()).toContainEqual(tradingSellActions.setFormStep('PREVIEW'));
    });

    it('opens the bank account step when the bank account provider knows a verified account', async () => {
        const store = buildStore({ flow: 'BANK_ACCOUNT' });

        await store.dispatch(
            selectSellQuoteThunk({
                quote: {
                    ...QUOTE,
                    bankAccounts: [mockBankAccount()],
                },
            }),
        );

        expect(store.getActions()).toContainEqual(tradingSellActions.setFormStep('BANK_ACCOUNT'));
    });

    it('opens the preview step when the bank account provider requests a login first', async () => {
        const store = buildStore({ flow: 'BANK_ACCOUNT' });

        await store.dispatch(selectSellQuoteThunk({ quote: { ...QUOTE, quoteId: undefined } }));

        expect(store.getActions()).toContainEqual(tradingSellActions.setFormStep('PREVIEW'));
    });

    it('returns early without reporting analytics when the quotes request is missing', async () => {
        const report = mock<DesktopAnalytics['report']>();
        const store = buildStore({ report, quotesRequest: undefined });

        await store.dispatch(selectSellQuoteThunk({ quote: QUOTE, fractionButton: 4 }));

        expect(report).not.toHaveBeenCalled();
    });

    it('navigates to sell confirm', async () => {
        const store = buildStore({
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

        expect(store.getActions()).toEqual(
            expect.arrayContaining([
                expect.objectContaining({
                    type: routerLocationChange.type,
                    payload: expect.objectContaining({
                        pathname: '/accounts/coinmarket/sell/confirm',
                    }),
                }),
            ]),
        );
    });
});
