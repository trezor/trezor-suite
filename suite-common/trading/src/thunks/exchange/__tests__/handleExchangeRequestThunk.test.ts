import { combineReducers } from '@reduxjs/toolkit';
import { CryptoId, ExchangeTrade } from 'invity-api';

import { configureMockStore, extraDependenciesMock } from '@suite-common/test-utils';
import { getNetwork } from '@suite-common/wallet-config';

import { exchangeThunks } from '../../';
import { MIN_MAX_QUOTES_OK } from '../../../__fixtures__/exchangeUtils';
import { invityAPI } from '../../../invityAPI';
import { initialState, prepareTradingReducer } from '../../../reducers/tradingReducer';
import { TradingExchangeFormProps } from '../../../types';
import { HandleExchangeRequestThunkProps } from '../handleExchangeRequestThunk';

const tradingReducer = prepareTradingReducer(extraDependenciesMock);

describe('handleExchangeRequestThunk', () => {
    afterEach(() => {
        jest.clearAllMocks();
    });

    jest.mock('../../../invityAPI');

    invityAPI.setInvityServersEnvironment = () => {};
    invityAPI.createInvityAPIKey = () => {};

    const getMocks = () => {
        const store = configureMockStore({
            extra: {},
            reducer: combineReducers({
                wallet: combineReducers({
                    tradingNew: tradingReducer,
                }),
            }),
            preloadedState: {
                wallet: {
                    tradingNew: {
                        ...initialState,
                        info: {
                            ...initialState.info,
                            coins: {
                                bitcoin: {
                                    symbol: 'btc',
                                    name: 'Bitcoin',
                                    coingeckoId: 'bitcoin',
                                    services: {
                                        buy: false,
                                        sell: false,
                                        exchange: true,
                                    },
                                },
                            },
                        },
                    },
                },
            },
        });

        const mockTimerLoading = jest.fn();
        const mockTimerStop = jest.fn();
        const mockTimerReset = jest.fn();
        const mockTimer = {
            loading: mockTimerLoading,
            stop: mockTimerStop,
            reset: mockTimerReset,
        } as unknown as HandleExchangeRequestThunkProps['timer'];

        const mockComposeRequestCallback = jest.fn();

        const formValues: TradingExchangeFormProps = {
            feePerUnit: '',
            feeLimit: '',
            options: ['broadcast'],
            bitcoinLockTime: '',
            ethereumNonce: '',
            ethereumDataAscii: '',
            ethereumDataHex: '',
            destinationTag: '',
            outputs: [
                {
                    type: 'payment',
                    address: 'address',
                    amount: '0.0015',
                    fiat: '',
                    currency: { value: 'usd', label: 'USD' },
                    token: null,
                    label: '',
                },
            ],
            isCoinControlEnabled: false,
            hasCoinControlBeenOpened: false,
            utxoSorting: 'newestFirst',
            selectedUtxos: [],
            amountInCrypto: true,
            sendCryptoSelect: {
                value: 'bitcoin' as CryptoId,
                label: 'BTC',
                cryptoName: 'Bitcoin',
                descriptor: 'descriptor',
                balance: '0.00297589',
                accountType: 'normal',
                decimals: 8,
            },
            receiveCryptoSelect: {
                type: 'currency',
                value: 'ethereum' as CryptoId,
                label: 'ETH',
                cryptoName: 'Ethereum',
                coingeckoId: 'ethereum',
                contractAddress: null,
                symbol: 'eth',
            },
            rateType: 'fixed',
            exchangeType: 'CEX',
            exchangeComparatorKycFilter: 'all',
            exchangeComparatorRateFilter: 'all',
        };
        const input: HandleExchangeRequestThunkProps = {
            formValues,
            network: getNetwork('btc'),
            timer: mockTimer,
            shouldSendInSats: false,
            composeRequestCallback: mockComposeRequestCallback,
        };

        return {
            input,
            mockTimerLoading,
            mockTimerStop,
            mockTimerReset,
            store,
        };
    };

    it('should successfully request quotes and save them', async () => {
        const { input, store, mockTimerLoading, mockTimerReset } = getMocks();
        const mockQuotes = [...MIN_MAX_QUOTES_OK];

        invityAPI.getExchangeQuotes = () => Promise.resolve(mockQuotes);

        const quotesResponse = await store
            .dispatch(exchangeThunks.handleRequestThunk(input))
            .unwrap();

        const state = store.getState().wallet.tradingNew;

        expect(mockTimerLoading).toHaveBeenCalledTimes(1);
        expect(state.exchange.amountLimits).toBeUndefined();
        expect(state.exchange.quotes.length).toEqual(11);
        expect(quotesResponse?.length).toEqual(11);
        expect(state.exchange.quotesRequest).toEqual({
            dex: 'enable',
            receive: 'ethereum',
            send: 'bitcoin',
            sendStringAmount: '0.0015',
        });
        expect(input.composeRequestCallback).toHaveBeenCalledTimes(1);
        expect(mockTimerReset).toHaveBeenCalledTimes(1);
        expect(state.isLoading).toBe(false);
    });

    it('should successfully request quotes, save them, but not call composeRequestCallback', async () => {
        const { input, store, mockTimerLoading, mockTimerReset } = getMocks();
        const mockQuotes: ExchangeTrade[] = [
            {
                ...MIN_MAX_QUOTES_OK[0],
                quoteId: undefined,
                orderId: undefined,
            },
        ];

        invityAPI.getExchangeQuotes = () => Promise.resolve(mockQuotes);

        const quotesResponse = await store
            .dispatch(
                exchangeThunks.handleRequestThunk({
                    ...input,
                    formValues: {
                        ...input.formValues,
                        setMaxOutputId: 0,
                    },
                }),
            )
            .unwrap();

        const state = store.getState().wallet.tradingNew;

        expect(mockTimerLoading).toHaveBeenCalledTimes(1);
        expect(state.exchange.amountLimits).toBeUndefined();
        expect(state.exchange.quotes.length).toEqual(1);
        expect(quotesResponse?.length).toEqual(1);
        expect(state.exchange.quotesRequest).toEqual({
            dex: 'enable',
            receive: 'ethereum',
            send: 'bitcoin',
            sendStringAmount: '0.0015',
        });
        expect(input.composeRequestCallback).toHaveBeenCalledTimes(0);
        expect(mockTimerReset).toHaveBeenCalledTimes(1);
        expect(state.isLoading).toBe(false);
    });

    describe('should not save quotes when', () => {
        const { input, store, mockTimerLoading, mockTimerStop } = getMocks();
        const outputs = input.formValues.outputs.map(output => ({
            ...output,
            amount: undefined as unknown as string,
        }));
        const inputAmountIncorrect = {
            ...input,
            formValues: {
                ...input.formValues,
                outputs,
            },
        };
        const inputReceiveCryptoSelectIncorrect = {
            ...input,
            formValues: {
                ...input.formValues,
                receiveCryptoSelect: null,
            },
        };
        const inputSendCryptoSelectIncorrect = {
            ...input,
            formValues: {
                ...input.formValues,
                sendCryptoSelect: undefined,
            },
        };

        it.each([
            ['output amount is incorrect', inputAmountIncorrect],
            ['receiveCryptoSelect is not selected', inputReceiveCryptoSelectIncorrect],
            ['sendCryptoSelect is not selected', inputSendCryptoSelectIncorrect],
        ])(`%s`, async (_description, formValues) => {
            const promise = store.dispatch(exchangeThunks.handleRequestThunk(formValues));

            await promise;

            const state = store.getState().wallet.tradingNew;

            expect(mockTimerLoading).toHaveBeenCalledTimes(1);
            expect(mockTimerStop).toHaveBeenCalledTimes(1);
            expect(state.exchange.quotesRequest).toBeUndefined();
            expect(state.exchange.quotes.length).toEqual(0);
            expect(state.isLoading).toBe(false);
            await expect(() => promise.unwrap()).rejects.toEqual('Invalid request data');
        });
    });

    it('should not save quotes, when request is aborted', async () => {
        const { input, store, mockTimerLoading, mockTimerReset } = getMocks();

        invityAPI.getExchangeQuotes = () => Promise.resolve([]);

        const promise = store.dispatch(exchangeThunks.handleRequestThunk(input));

        promise.abort();

        await promise;

        const state = store.getState().wallet.tradingNew;

        expect(mockTimerLoading).toHaveBeenCalledTimes(1);
        expect(mockTimerReset).toHaveBeenCalledTimes(1);
        expect(state.exchange.quotes.length).toEqual(0);
        expect(state.exchange.quotesRequest).toBeUndefined();
        expect(state.isLoading).toBe(false);
    });

    it('should not save quotes when empty array is returned from the response', async () => {
        const { input, store, mockTimerLoading, mockTimerStop } = getMocks();

        invityAPI.getExchangeQuotes = () => Promise.resolve([]);

        const quotesResponse = await store
            .dispatch(exchangeThunks.handleRequestThunk(input))
            .unwrap();

        const state = store.getState().wallet.tradingNew;

        expect(mockTimerLoading).toHaveBeenCalledTimes(1);
        expect(mockTimerStop).toHaveBeenCalledTimes(1);
        expect(state.exchange.quotes.length).toEqual(0);
        expect(state.exchange.quotesRequest).toBeUndefined();
        expect(state.isLoading).toBe(false);
        expect(quotesResponse).toEqual([]);
    });
});
