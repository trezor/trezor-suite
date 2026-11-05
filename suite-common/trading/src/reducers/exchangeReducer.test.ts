import { type UnknownAction, combineReducers } from '@reduxjs/toolkit';
import { type CryptoId, type ExchangeTrade } from 'invity-api';

import { createTestCompositionRoot } from '@suite-common/test-utils';
import { toNetworkSymbolNonTestnet } from '@suite-common/wallet-config';
import { type AccountKey } from '@suite-common/wallet-types';

import { type TradingExchangeFormProps } from '../types';
import {
    changellyExchangeQuote,
    exchangeTradingFixtures,
} from './__fixtures__/exchangeTradingReducer';
import {
    type TradingExchangeState,
    tradingExchangeActions,
    tradingExchangeReducer,
} from './exchangeReducer';

type State = { wallet: { trading: { exchange: TradingExchangeState } } };

const btcSymbol = toNetworkSymbolNonTestnet('btc');
const ethSymbol = toNetworkSymbolNonTestnet('eth');

const FORM_VALUES: TradingExchangeFormProps = {
    feePerUnit: '',
    feeLimit: '',
    options: ['broadcast'],
    bitcoinLocktimeBlockHeight: '',
    bitcoinLocktimeDatetime: '',
    ethereumNonce: '',
    transactionData: '',
    destinationTag: '',
    isCoinControlEnabled: false,
    hasCoinControlBeenOpened: false,
    utxoSorting: 'newestFirst',
    selectedUtxos: [],
    outputs: [
        {
            type: 'payment',
            address: 'address',
            amount: '0.01',
            fiat: '',
            currency: { value: 'eur', label: 'EUR' },
            token: null,
            label: '',
        },
    ],
    amountInCrypto: true,
    sendCryptoSelect: {
        id: 'bitcoin' as CryptoId,
        isNativeToken: true,
        name: 'Bitcoin',
        symbol: btcSymbol,
        coingeckoId: 'bitcoin',
        displaySymbol: 'BTC',
        contractAddress: null,
        networkName: 'Bitcoin',
        networkSymbol: btcSymbol,
        accountKey: 'account-1' as AccountKey,
    },
    receiveCryptoSelect: {
        id: 'ethereum' as CryptoId,
        isNativeToken: true,
        name: 'Ethereum',
        symbol: ethSymbol,
        coingeckoId: 'ethereum',
        displaySymbol: 'ETH',
        contractAddress: null,
        networkName: 'Ethereum',
        networkSymbol: ethSymbol,
    },
    rateType: 'fixed',
    exchangeType: 'CEX',
    exchangeComparatorKycFilter: 'all',
    exchangeComparatorRateFilter: 'all',
};

describe('tradingExchangeReducer', () => {
    exchangeTradingFixtures.forEach(fixture => {
        it(fixture.description, () => {
            const { store } = createTestCompositionRoot<void, State>({
                reducer: combineReducers({
                    wallet: combineReducers({
                        trading: combineReducers({
                            exchange: tradingExchangeReducer,
                        }),
                    }),
                }),
                preloadedState: {
                    wallet: {
                        trading: {
                            exchange: fixture.initialState,
                        },
                    },
                },
            }).services;
            fixture.actions.forEach(action => {
                store.dispatch(action);
            });
            expect(store.getState().wallet.trading.exchange).toEqual(fixture.result);
        });
    });

    describe('lastErrorMessage', () => {
        it('should be undefined initially', () => {
            const state = tradingExchangeReducer(undefined, { type: 'unknown' });

            expect(state.lastErrorMessage).toBeUndefined();
        });

        it('setLastErrorMessage should set lastErrorMessage', () => {
            const state = tradingExchangeReducer(
                undefined,
                tradingExchangeActions.setLastErrorMessage('Some error'),
            );

            expect(state.lastErrorMessage).toBe('Some error');
        });
    });

    describe('setSelectedQuoteSwapSlippage', () => {
        it('should do nothing when no quote is selected', () => {
            const actions = [tradingExchangeActions.setSelectedQuoteSwapSlippage('3')];

            const state = actions.reduce(tradingExchangeReducer, undefined);

            expect(state?.selectedQuote).toBeUndefined();
        });

        it('should do nothing when CEX quote is selected', () => {
            const actions = [
                tradingExchangeActions.saveSelectedQuote(changellyExchangeQuote),
                tradingExchangeActions.setSelectedQuoteSwapSlippage('3'),
            ];

            const state = actions.reduce(tradingExchangeReducer, undefined);

            expect(state?.selectedQuote).toBeDefined();
            expect(state?.selectedQuote?.swapSlippage).toBeUndefined();
        });

        it('should set selected quote swap slippage for DEX quote', () => {
            const actions = [
                tradingExchangeActions.saveSelectedQuote({
                    ...changellyExchangeQuote,
                    isDex: true,
                }),
                tradingExchangeActions.setSelectedQuoteSwapSlippage('3'),
            ];

            const state = actions.reduce(tradingExchangeReducer, undefined);

            expect(state?.selectedQuote?.swapSlippage).toBe('3');
        });
    });

    describe('saveFormValues', () => {
        it('stores a copy of the form values', () => {
            const state = tradingExchangeReducer(
                undefined,
                tradingExchangeActions.saveFormValues(FORM_VALUES),
            );

            expect(state.formValues).toEqual(FORM_VALUES);
            expect(state.formValues).not.toBe(FORM_VALUES);
            expect(state.formValues?.outputs).not.toBe(FORM_VALUES.outputs);
        });
    });

    describe('clearQuotesAndParams', () => {
        it('clears quotes, quotesRequest, formValues, selectedQuote and amountLimits', () => {
            const actions = [
                tradingExchangeActions.saveSelectedQuote(changellyExchangeQuote),
                tradingExchangeActions.saveQuotes([changellyExchangeQuote]),
                tradingExchangeActions.saveFormValues(FORM_VALUES),
                tradingExchangeActions.clearQuotesAndParams(),
            ];

            const state = actions.reduce(tradingExchangeReducer, undefined);

            expect(state?.quotes).toEqual([]);
            expect(state?.quotesRequest).toBeUndefined();
            expect(state?.formValues).toBeUndefined();
            expect(state?.selectedQuote).toBeUndefined();
            expect(state?.amountLimits).toBeUndefined();
        });
    });

    describe('setTradingAccountKey', () => {
        it('clears the form values when the account key changes', () => {
            const actions = [
                tradingExchangeActions.setTradingAccountKey('account-1' as AccountKey),
                tradingExchangeActions.saveFormValues(FORM_VALUES),
                tradingExchangeActions.setTradingAccountKey('account-2' as AccountKey),
            ];

            const state = actions.reduce(tradingExchangeReducer, undefined);

            expect(state?.formValues).toBeUndefined();
        });

        it('keeps the form values when the same account key is set', () => {
            const actions = [
                tradingExchangeActions.setTradingAccountKey('account-1' as AccountKey),
                tradingExchangeActions.saveFormValues(FORM_VALUES),
                tradingExchangeActions.setTradingAccountKey('account-1' as AccountKey),
            ];

            const state = actions.reduce(tradingExchangeReducer, undefined);

            expect(state?.formValues).toEqual(FORM_VALUES);
        });

        it('clears selected quote, quotes and form values when the account key is cleared', () => {
            const actions = [
                tradingExchangeActions.saveSelectedQuote(changellyExchangeQuote),
                tradingExchangeActions.saveQuotes([changellyExchangeQuote]),
                tradingExchangeActions.saveFormValues(FORM_VALUES),
                tradingExchangeActions.setTradingAccountKey('account-1' as AccountKey),
                tradingExchangeActions.setTradingAccountKey(undefined),
            ];

            const state = actions.reduce(tradingExchangeReducer, undefined);

            expect(state?.tradingAccountKey).toBeUndefined();
            expect(state?.selectedQuote).toBeUndefined();
            expect(state?.quotes).toEqual([]);
            expect(state?.quotesRequest).toBeUndefined();
            expect(state?.formValues).toBeUndefined();
        });
    });

    describe('approvalFlow', () => {
        const STEPS = ['revoke', 'approve', 'swap'] as const;

        it('stores the step plan', () => {
            const state = tradingExchangeReducer(
                undefined,
                tradingExchangeActions.startApprovalFlow([...STEPS]),
            );

            expect(state.approvalFlow).toEqual({ steps: STEPS, completedSteps: [] });
        });

        it('records completed steps', () => {
            const actions = [
                tradingExchangeActions.startApprovalFlow([...STEPS]),
                tradingExchangeActions.completeApprovalFlowStep('revoke'),
            ];

            const state = actions.reduce(tradingExchangeReducer, undefined);

            expect(state?.approvalFlow?.completedSteps).toEqual(['revoke']);
        });

        it('records a completed step only once', () => {
            const actions = [
                tradingExchangeActions.startApprovalFlow([...STEPS]),
                tradingExchangeActions.completeApprovalFlowStep('revoke'),
                tradingExchangeActions.completeApprovalFlowStep('revoke'),
            ];

            const state = actions.reduce(tradingExchangeReducer, undefined);

            expect(state?.approvalFlow?.completedSteps).toEqual(['revoke']);
        });

        it('starts a new flow without completed steps', () => {
            const actions = [
                tradingExchangeActions.startApprovalFlow([...STEPS]),
                tradingExchangeActions.completeApprovalFlowStep('revoke'),
                tradingExchangeActions.startApprovalFlow([...STEPS]),
            ];

            const state = actions.reduce(tradingExchangeReducer, undefined);

            expect(state?.approvalFlow?.completedSteps).toEqual([]);
        });

        it('keeps the step plan when the selected quote is replaced', () => {
            const actions = [
                tradingExchangeActions.saveSelectedQuote(changellyExchangeQuote),
                tradingExchangeActions.startApprovalFlow([...STEPS]),
                tradingExchangeActions.saveSelectedQuote({
                    ...changellyExchangeQuote,
                    status: 'APPROVAL_PENDING',
                }),
            ];

            const state = actions.reduce(tradingExchangeReducer, undefined);

            expect(state?.approvalFlow?.steps).toEqual(STEPS);
        });

        it.each([
            ['clearApprovalFlow', tradingExchangeActions.clearApprovalFlow()],
            ['clearQuotes', tradingExchangeActions.clearQuotes()],
            ['clearQuotesAndParams', tradingExchangeActions.clearQuotesAndParams()],
            [
                'setTradingAccountKey(undefined)',
                tradingExchangeActions.setTradingAccountKey(undefined),
            ],
        ])('is cleared by %s', (_, clearAction) => {
            const actions = [tradingExchangeActions.startApprovalFlow([...STEPS]), clearAction];

            const state = actions.reduce(tradingExchangeReducer, undefined);

            expect(state?.approvalFlow).toBeUndefined();
        });
    });

    describe('selectedQuoteTimestamp', () => {
        const SELECTED_QUOTE_TIMESTAMP = new Date('2026-10-23T10:00:00Z').getTime();

        it('stores the time the selected quote was confirmed', () => {
            const actions = [
                tradingExchangeActions.saveSelectedQuote(changellyExchangeQuote),
                tradingExchangeActions.setSelectedQuoteTimestamp(SELECTED_QUOTE_TIMESTAMP),
            ];

            const state = actions.reduce(tradingExchangeReducer, undefined);

            expect(state?.selectedQuoteTimestamp).toBe(SELECTED_QUOTE_TIMESTAMP);
        });

        const confirmedTrade = { ...changellyExchangeQuote, orderId: 'order-1' };

        it('is kept when the same confirmed trade is saved again', () => {
            const actions = [
                tradingExchangeActions.saveSelectedQuote(confirmedTrade),
                tradingExchangeActions.setSelectedQuoteTimestamp(SELECTED_QUOTE_TIMESTAMP),
                tradingExchangeActions.saveSelectedQuote({ ...confirmedTrade, status: 'CONFIRM' }),
            ];

            const state = actions.reduce(tradingExchangeReducer, undefined);

            expect(state?.selectedQuote?.status).toBe('CONFIRM');
            expect(state?.selectedQuoteTimestamp).toBe(SELECTED_QUOTE_TIMESTAMP);
        });

        it.each<[string, ExchangeTrade]>([
            ['another confirmed trade', { ...confirmedTrade, orderId: 'order-2' }],
            ['an unconfirmed quote', { ...changellyExchangeQuote, orderId: undefined }],
        ])('is dropped when %s is saved', (_quote, quote) => {
            const actions = [
                tradingExchangeActions.saveSelectedQuote(confirmedTrade),
                tradingExchangeActions.setSelectedQuoteTimestamp(SELECTED_QUOTE_TIMESTAMP),
                tradingExchangeActions.saveSelectedQuote(quote),
            ];

            const state = actions.reduce(tradingExchangeReducer, undefined);

            expect(state?.selectedQuote).toEqual(quote);
            expect(state?.selectedQuoteTimestamp).toBeUndefined();
        });

        it.each<[string, UnknownAction]>([
            ['saveSelectedQuote(undefined)', tradingExchangeActions.saveSelectedQuote(undefined)],
            ['clearQuotes', tradingExchangeActions.clearQuotes()],
            ['clearQuotesAndParams', tradingExchangeActions.clearQuotesAndParams()],
            [
                'setTradingAccountKey(undefined)',
                tradingExchangeActions.setTradingAccountKey(undefined),
            ],
        ])('is cleared together with the selected quote by %s', (_action, action) => {
            const actions = [
                tradingExchangeActions.saveSelectedQuote(changellyExchangeQuote),
                tradingExchangeActions.setSelectedQuoteTimestamp(SELECTED_QUOTE_TIMESTAMP),
                action,
            ];

            const state = actions.reduce(tradingExchangeReducer, undefined);

            expect(state?.selectedQuote).toBeUndefined();
            expect(state?.selectedQuoteTimestamp).toBeUndefined();
        });
    });
});

describe('exchangeReducer allowance', () => {
    const ACCOUNT_KEY = 'account-1' as AccountKey;
    const KEY = {
        accountKey: ACCOUNT_KEY,
        tokenContractAddress: '0xdac17f958d2ee523a2206206994597c13d831ec7',
        spender: '0x1231deb6f5749ef6ce6943a275a1d3e7486f4eae',
    };
    const OTHER_KEY = { ...KEY, spender: '0x1111111111111111111111111111111111111111' };

    it('is not tracked initially', () => {
        const state = tradingExchangeReducer(undefined, { type: 'init' });

        expect(state.allowance).toBeUndefined();
    });

    it('starts a read without an amount', () => {
        const state = [tradingExchangeActions.startAllowanceRead(KEY)].reduce(
            tradingExchangeReducer,
            undefined,
        );

        expect(state?.allowance).toEqual({
            ...KEY,
            status: 'loading',
            amount: undefined,
        });
    });

    it('keeps the last amount while the same key is re-read', () => {
        const state = [
            tradingExchangeActions.startAllowanceRead(KEY),
            tradingExchangeActions.setAllowance({ ...KEY, amount: '50' }),
            tradingExchangeActions.startAllowanceRead({
                ...KEY,
                spender: KEY.spender.toUpperCase(),
            }),
        ].reduce(tradingExchangeReducer, undefined);

        expect(state?.allowance).toEqual({
            ...KEY,
            spender: KEY.spender.toUpperCase(),
            status: 'loading',
            amount: '50',
        });
    });

    it('drops the amount when another key is read', () => {
        const state = [
            tradingExchangeActions.startAllowanceRead(KEY),
            tradingExchangeActions.setAllowance({ ...KEY, amount: '50' }),
            tradingExchangeActions.startAllowanceRead(OTHER_KEY),
        ].reduce(tradingExchangeReducer, undefined);

        expect(state?.allowance).toEqual({
            ...OTHER_KEY,
            status: 'loading',
            amount: undefined,
        });
    });

    it('stores the read amount', () => {
        const state = [
            tradingExchangeActions.startAllowanceRead(KEY),
            tradingExchangeActions.setAllowance({ ...KEY, amount: '50' }),
        ].reduce(tradingExchangeReducer, undefined);

        expect(state?.allowance).toEqual({
            ...KEY,
            status: 'loaded',
            amount: '50',
        });
    });

    it.each<[string, UnknownAction]>([
        ['an amount', tradingExchangeActions.setAllowance({ ...OTHER_KEY, amount: '50' })],
        [
            'an error',
            tradingExchangeActions.setAllowanceError({ ...OTHER_KEY, errorMessage: 'timeout' }),
        ],
    ])('ignores %s for a key that is not being read', (_result, action) => {
        const state = [tradingExchangeActions.startAllowanceRead(KEY), action].reduce(
            tradingExchangeReducer,
            undefined,
        );

        expect(state?.allowance).toEqual({
            ...KEY,
            status: 'loading',
            amount: undefined,
        });
    });

    it('drops the amount and keeps the reason when the read fails', () => {
        const state = [
            tradingExchangeActions.startAllowanceRead(KEY),
            tradingExchangeActions.setAllowance({ ...KEY, amount: '50' }),
            tradingExchangeActions.startAllowanceRead(KEY),
            tradingExchangeActions.setAllowanceError({ ...KEY, errorMessage: 'timeout' }),
        ].reduce(tradingExchangeReducer, undefined);

        expect(state?.allowance).toEqual({
            ...KEY,
            status: 'error',
            amount: undefined,
            errorMessage: 'timeout',
        });
    });

    it('forgets the failure reason when the key is read again', () => {
        const state = [
            tradingExchangeActions.startAllowanceRead(KEY),
            tradingExchangeActions.setAllowanceError({ ...KEY, errorMessage: 'timeout' }),
            tradingExchangeActions.startAllowanceRead(KEY),
        ].reduce(tradingExchangeReducer, undefined);

        expect(state?.allowance?.errorMessage).toBeUndefined();
    });

    it('is cleared', () => {
        const state = [
            tradingExchangeActions.startAllowanceRead(KEY),
            tradingExchangeActions.setAllowance({ ...KEY, amount: '50' }),
            tradingExchangeActions.clearAllowance(),
        ].reduce(tradingExchangeReducer, undefined);

        expect(state?.allowance).toBeUndefined();
    });
});
