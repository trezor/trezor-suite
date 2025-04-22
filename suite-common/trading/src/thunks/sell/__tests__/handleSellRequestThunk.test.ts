import { combineReducers } from '@reduxjs/toolkit';
import { CryptoId, SellFiatTrade } from 'invity-api';

import { configureMockStore, extraDependenciesMock } from '@suite-common/test-utils';
import { getNetwork } from '@suite-common/wallet-config';
import { amountToSmallestUnit } from '@suite-common/wallet-utils';

import { sellThunks } from '../../';
import { invityAPI } from '../../../invityAPI';
import { initialState, prepareTradingReducer } from '../../../reducers/tradingReducer';
import { TradingSellFormProps } from '../../../types';
import { sellUtilsFixtures } from '../../../utils/sell/__fixtures__/sellUtils';
import { HandleSellRequestThunkProps } from '../handleSellRequestThunk';

const tradingReducer = prepareTradingReducer(extraDependenciesMock);

describe('handleSellRequestThunk', () => {
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
                                        sell: true,
                                        exchange: false,
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
        } as unknown as HandleSellRequestThunkProps['timer'];

        const mockComposeRequestCallback = jest.fn();

        const formValues: TradingSellFormProps = {
            outputs: [
                {
                    type: 'payment',
                    address: 'address',
                    amount: '0.0015',
                    fiat: '50',
                    currency: { value: 'usd', label: 'USD' },
                    token: null,
                    label: '',
                },
            ],
            countrySelect: { value: 'US', label: 'United States' },
            sendCryptoSelect: {
                value: 'bitcoin' as CryptoId,
                label: 'BTC',
                cryptoName: 'Bitcoin',
                descriptor: 'descriptor',
                balance: '0.00297589',
                accountType: 'normal',
                decimals: 8,
            },
            amountInCrypto: true,
            feePerUnit: '',
            feeLimit: '',
            options: ['broadcast'],
            bitcoinLockTime: '',
            ethereumNonce: '',
            ethereumDataAscii: '',
            ethereumDataHex: '',
            rippleDestinationTag: '',
            isCoinControlEnabled: false,
            hasCoinControlBeenOpened: false,
            utxoSorting: 'newestFirst',
            selectedUtxos: [],
        };

        const input: HandleSellRequestThunkProps = {
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

    it('should successfully request sell quotes and save them', async () => {
        const { input, store, mockTimerLoading, mockTimerReset } = getMocks();
        const mockQuotes = [...sellUtilsFixtures.MIN_MAX_QUOTES_OK];

        invityAPI.getSellQuotes = () => Promise.resolve(mockQuotes);

        const quotesResponse = await store.dispatch(sellThunks.handleRequestThunk(input)).unwrap();

        const state = store.getState().wallet.tradingNew;

        expect(mockTimerLoading).toHaveBeenCalledTimes(1);
        expect(state.sell.amountLimits).toBeUndefined();
        expect(state.sell.quotes.length).toEqual(1);
        expect(quotesResponse?.length).toEqual(1);
        expect(state.sell.quotesRequest).toEqual({
            amountInCrypto: true,
            cryptoCurrency: 'bitcoin',
            fiatCurrency: 'USD',
            country: 'US',
            cryptoStringAmount: '0.0015',
            fiatStringAmount: '50',
            flows: ['BANK_ACCOUNT', 'PAYMENT_GATE'],
        });
        expect(input.composeRequestCallback).toHaveBeenCalledTimes(1);
        expect(mockTimerReset).toHaveBeenCalledTimes(1);
        expect(state.isLoading).toBe(false);
    });

    it('should successfully request sell quotes and save them with shouldSendInSats', async () => {
        const { input, store, mockTimerLoading, mockTimerReset } = getMocks();
        const mockQuotes = sellUtilsFixtures.MIN_MAX_QUOTES_OK.map(quote => ({
            ...quote,
            orderId: undefined,
        }));

        invityAPI.getSellQuotes = () => Promise.resolve(mockQuotes);

        const quotesResponse = await store
            .dispatch(
                sellThunks.handleRequestThunk({
                    ...input,
                    formValues: {
                        ...input.formValues,
                        outputs: input.formValues.outputs.map(output => ({
                            ...output,
                            amount: amountToSmallestUnit(output.amount, 8),
                        })),
                    },
                    shouldSendInSats: true,
                }),
            )
            .unwrap();

        const state = store.getState().wallet.tradingNew;

        expect(mockTimerLoading).toHaveBeenCalledTimes(1);
        expect(state.sell.amountLimits).toBeUndefined();
        expect(state.sell.quotes.length).toEqual(1);
        expect(quotesResponse?.length).toEqual(1);
        expect(state.sell.quotesRequest).toEqual({
            amountInCrypto: true,
            cryptoCurrency: 'bitcoin',
            fiatCurrency: 'USD',
            country: 'US',
            cryptoStringAmount: '0.0015',
            fiatStringAmount: '50',
            flows: ['BANK_ACCOUNT', 'PAYMENT_GATE'],
        });
        expect(input.composeRequestCallback).toHaveBeenCalledTimes(1);
        expect(mockTimerReset).toHaveBeenCalledTimes(1);
        expect(state.isLoading).toBe(false);
    });

    it('should successfully request sell quotes and save them when there is not currency in coins', async () => {
        const { input, store, mockTimerLoading, mockTimerReset } = getMocks();
        const mockQuotes = sellUtilsFixtures.MIN_MAX_QUOTES_OK.map(quote => ({
            ...quote,
            cryptoCurrency: 'ethereum',
            orderId: undefined,
        })) as SellFiatTrade[];

        invityAPI.getSellQuotes = () => Promise.resolve(mockQuotes);

        const quotesResponse = await store
            .dispatch(
                sellThunks.handleRequestThunk({
                    ...input,
                    formValues: {
                        ...input.formValues,
                        outputs: input.formValues.outputs.map(output => ({
                            ...output,
                        })),
                        sendCryptoSelect: {
                            ...input.formValues.sendCryptoSelect,
                            value: 'ethereum' as CryptoId,
                            label: 'ETH',
                            cryptoName: 'Ethereum',
                            descriptor: 'descriptor',
                            balance: '0.00297589',
                            accountType: 'normal',
                            decimals: 8,
                        },
                    },
                }),
            )
            .unwrap();

        const state = store.getState().wallet.tradingNew;

        expect(mockTimerLoading).toHaveBeenCalledTimes(1);
        expect(state.sell.amountLimits).toBeUndefined();
        expect(state.sell.quotes.length).toEqual(1);
        expect(quotesResponse?.length).toEqual(1);
        expect(state.sell.quotesRequest).toEqual({
            amountInCrypto: true,
            cryptoCurrency: 'ethereum',
            fiatCurrency: 'USD',
            country: 'US',
            cryptoStringAmount: '0.0015',
            fiatStringAmount: '50',
            flows: ['BANK_ACCOUNT', 'PAYMENT_GATE'],
        });
        expect(input.composeRequestCallback).toHaveBeenCalledTimes(1);
        expect(mockTimerReset).toHaveBeenCalledTimes(1);
        expect(state.isLoading).toBe(false);
    });

    it('should not save quotes when request is aborted', async () => {
        const { input, store, mockTimerLoading, mockTimerReset } = getMocks();

        invityAPI.getSellQuotes = () => Promise.resolve([]);

        const promise = store.dispatch(sellThunks.handleRequestThunk(input));

        promise.abort();

        await promise;

        const state = store.getState().wallet.tradingNew;

        expect(mockTimerLoading).toHaveBeenCalledTimes(1);
        expect(mockTimerReset).toHaveBeenCalledTimes(1);
        expect(state.sell.quotes.length).toEqual(0);
        expect(state.sell.quotesRequest).toBeUndefined();
        expect(state.isLoading).toBe(false);
    });

    describe('should not save quotes when', () => {
        const { input, store, mockTimerLoading, mockTimerStop } = getMocks();
        const fiatAmountIncorrect = {
            ...input,
            formValues: {
                ...input.formValues,
                outputs: input.formValues.outputs.map(output => ({
                    ...output,
                    fiat: undefined as unknown as string, // Invalid fiat amount
                })),
            },
        };
        const amountIncorrect = {
            ...input,
            formValues: {
                ...input.formValues,
                outputs: input.formValues.outputs.map(output => ({
                    ...output,
                    amount: undefined as unknown as string, // Invalid amount
                })),
            },
        };

        it.each([
            ['output fiat amount is incorrect', fiatAmountIncorrect],
            ['output amount is incorrect', amountIncorrect],
        ])(`%s`, async (_description, formValues) => {
            jest.spyOn(invityAPI, 'getSellQuotes');

            const promise = store.dispatch(sellThunks.handleRequestThunk(formValues));
            await promise;

            const state = store.getState().wallet.tradingNew;

            expect(invityAPI.getSellQuotes).not.toHaveBeenCalled();
            expect(mockTimerLoading).toHaveBeenCalledTimes(1);
            expect(mockTimerStop).toHaveBeenCalledTimes(1);
            expect(state.sell.quotesRequest).toBeUndefined();
            expect(state.sell.quotes.length).toEqual(0);
            expect(state.isLoading).toBe(false);
            await expect(() => promise.unwrap()).rejects.toEqual('Invalid request data');
        });
    });

    it('should not proceed when requestData is null', async () => {
        const { input, store, mockTimerStop } = getMocks();

        const modifiedInput = {
            ...input,
            formValues: {
                ...input.formValues,
                outputs: [
                    {
                        ...input.formValues.outputs[0],
                        amount: undefined as unknown as string, // Invalid amount
                    },
                ],
            },
        };

        const promise = store.dispatch(sellThunks.handleRequestThunk(modifiedInput));
        await promise;

        const state = store.getState().wallet.tradingNew;

        expect(mockTimerStop).toHaveBeenCalledTimes(1);
        expect(state.sell.quotes.length).toEqual(0);
        expect(state.sell.quotesRequest).toBeUndefined();
        expect(state.isLoading).toBe(false);
        await expect(() => promise.unwrap()).rejects.toEqual('Invalid request data');
    });

    it('should not save quotes when empty array is returned from the response', async () => {
        const { input, store, mockTimerLoading, mockTimerStop } = getMocks();

        invityAPI.getSellQuotes = () => Promise.resolve([]);

        const quotesResponse = await store.dispatch(sellThunks.handleRequestThunk(input)).unwrap();

        const state = store.getState().wallet.tradingNew;

        expect(mockTimerLoading).toHaveBeenCalledTimes(1);
        expect(mockTimerStop).toHaveBeenCalledTimes(1);
        expect(state.sell.quotes.length).toEqual(0);
        expect(state.sell.quotesRequest).toBeDefined();
        expect(state.isLoading).toBe(false);
        expect(quotesResponse).toEqual([]);
    });

    it('should save quotes but not call composeRequestCallback when setMaxOutputId is defined', async () => {
        const { input, store, mockTimerLoading, mockTimerReset } = getMocks();
        const mockQuotes = sellUtilsFixtures.MIN_MAX_QUOTES_OK.map(quote => ({
            ...quote,
            orderId: undefined,
        }));

        invityAPI.getSellQuotes = () => Promise.resolve(mockQuotes);

        const modifiedInput = {
            ...input,
            formValues: {
                ...input.formValues,
                setMaxOutputId: 0, // Simulate max balance computation
            },
        };

        const quotesResponse = await store
            .dispatch(sellThunks.handleRequestThunk(modifiedInput))
            .unwrap();

        const state = store.getState().wallet.tradingNew;

        expect(mockTimerLoading).toHaveBeenCalledTimes(1);
        expect(state.sell.quotes.length).toEqual(1);
        expect(quotesResponse?.length).toEqual(1);
        expect(input.composeRequestCallback).toHaveBeenCalledTimes(0); // Callback should not be called
        expect(mockTimerReset).toHaveBeenCalledTimes(1);
        expect(state.isLoading).toBe(false);
    });
});
