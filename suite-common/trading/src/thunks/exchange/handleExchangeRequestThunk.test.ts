import { combineReducers } from '@reduxjs/toolkit';
import { type CryptoId, type ExchangeTrade } from 'invity-api';

import { mockActionType, mockReducer } from '@suite-common/redux-utils/mocks';
import { configureMockStore } from '@suite-common/test-utils';
import { getNetwork, toNetworkSymbolNonTestnet } from '@suite-common/wallet-config';
import { prepareAccountsReducer } from '@suite-common/wallet-core';
import { mockSetAccountAddMetadata } from '@suite-common/wallet-core/mocks';
import { type Account, type AccountKey } from '@suite-common/wallet-types';
import { mockAccountKey } from '@suite-common/wallet-types/mocks';
import { cloneObject, mergeDeepObject } from '@trezor/utils';

import { MIN_MAX_QUOTES_OK } from '../../__fixtures__/exchangeUtils';
import { accountEth } from '../../__fixtures__/utils';
import { initialState } from '../../reducers/tradingCommonReducer';
import { prepareTradingReducer } from '../../reducers/tradingReducer';
import { tradeApi } from '../../tradeApi';
import {
    type HandleExchangeRequestThunkProps,
    type TradingAssetOption,
    type TradingAssetSellOption,
    type TradingExchangeFormProps,
} from '../../types';

import { exchangeThunks } from './index';

const tradingReducer = prepareTradingReducer({
    actionTypes: { storageLoad: mockActionType('storageLoad') },
});
const accountsReducer = prepareAccountsReducer({
    actionTypes: { storageLoad: mockActionType('storageLoad') },
    actions: { setAccountAddMetadata: mockSetAccountAddMetadata() },
    reducers: { storageLoadAccounts: mockReducer() },
});
const cloneExchangeQuotes = () => cloneObject(MIN_MAX_QUOTES_OK) as ExchangeTrade[];
const btcSymbol = toNetworkSymbolNonTestnet('btc');
const ethSymbol = toNetworkSymbolNonTestnet('eth');
const bscSymbol = toNetworkSymbolNonTestnet('bsc');
const etcSymbol = toNetworkSymbolNonTestnet('etc');

describe('handleExchangeRequestThunk', () => {
    afterEach(() => {
        jest.clearAllMocks();
    });

    jest.mock('../../tradeApi');

    tradeApi.setServersEnvironment = () => {};
    tradeApi.createApiKey = () => {};

    const getMocks = () => {
        const validEthAddress = '0x742d35Cc6634C0532925a3b844Bc454e4438f44e';
        const store = configureMockStore({
            extra: {
                services: {
                    addressValidator: {
                        getAddressType: jest.fn(),
                        isAddressValid: jest.fn(
                            (address, symbol) => address === validEthAddress && symbol === 'eth',
                        ),
                    },
                },
            },
            reducer: combineReducers({
                wallet: combineReducers({
                    trading: tradingReducer,
                    accounts: accountsReducer,
                }),
            }),
            preloadedState: {
                wallet: {
                    trading: {
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
                    accounts: [accountEth as unknown as Account],
                },
            },
        });

        const mockComposeRequestCallback = jest.fn();

        const formValues: TradingExchangeFormProps = {
            feePerUnit: '',
            feeLimit: '',
            options: ['broadcast'],
            bitcoinLocktimeBlockHeight: '',
            bitcoinLocktimeDatetime: '',
            ethereumNonce: '',
            transactionData: '',
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
                id: 'bitcoin' as CryptoId,
                isNativeToken: true,
                name: 'Bitcoin',
                coingeckoId: 'bitcoin',
                contractAddress: null,
                symbol: btcSymbol,
                displaySymbol: 'BTC',
                networkName: 'Bitcoin',
                networkSymbol: btcSymbol,
                accountKey: mockAccountKey({ descriptor: 'descriptor123', symbol: btcSymbol }),
            } satisfies TradingAssetSellOption,
            receiveCryptoSelect: {
                id: 'ethereum' as CryptoId,
                isNativeToken: true,
                name: 'Ethereum',
                coingeckoId: 'ethereum',
                contractAddress: null,
                symbol: ethSymbol,
                displaySymbol: 'ETH',
                displaySymbolName: 'Ethereum',
                networkName: 'Ethereum',
                networkSymbol: ethSymbol,
            } satisfies TradingAssetOption,
            rateType: 'fixed',
            exchangeType: 'CEX',
            exchangeComparatorKycFilter: 'all',
            exchangeComparatorRateFilter: 'all',
        };
        const input: HandleExchangeRequestThunkProps = {
            formValues,
            network: getNetwork(btcSymbol),
            shouldSendInSats: false,
            composeRequestCallback: mockComposeRequestCallback,
        };

        return {
            input,
            store,
        };
    };

    it('should successfully request quotes and save them', async () => {
        const { input, store } = getMocks();
        const mockQuotes = [...MIN_MAX_QUOTES_OK];

        tradeApi.getExchangeQuotes = () => Promise.resolve(mockQuotes);

        const quotesResponse = await store
            .dispatch(exchangeThunks.handleRequestThunk(input))
            .unwrap();

        const state = store.getState().wallet.trading;

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
        expect(state.isLoading).toBe(false);
    });

    it('should successfully request quotes, save them, but not call composeRequestCallback', async () => {
        const { input, store } = getMocks();
        const mockQuotes: ExchangeTrade[] = [
            {
                ...MIN_MAX_QUOTES_OK[0],
                quoteId: undefined,
                orderId: undefined,
            },
        ];

        tradeApi.getExchangeQuotes = () => Promise.resolve(mockQuotes);

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

        const state = store.getState().wallet.trading;

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
        expect(state.isLoading).toBe(false);
    });

    describe('should not save quotes when', () => {
        const { input, store } = getMocks();
        const overrideInput = (overrides: { formValues?: Record<string, unknown> }) =>
            mergeDeepObject.withOptions(
                { mergeArrays: false },
                input,
                overrides,
            ) as HandleExchangeRequestThunkProps;
        const outputs = input.formValues.outputs.map(output => ({
            ...output,
            amount: undefined as unknown as string,
        }));
        const inputAmountIncorrect = overrideInput({ formValues: { outputs } });
        const inputReceiveCryptoSelectIncorrect = overrideInput({
            formValues: { receiveCryptoSelect: null },
        });
        const inputSendCryptoSelectIncorrect = overrideInput({
            formValues: { sendCryptoSelect: undefined },
        });
        const inputCrossFormatLeak = overrideInput({
            formValues: {
                receiveCryptoSelect: input.formValues.sendCryptoSelect, // bitcoin
                receiveAddress: '0x742d35Cc6634C0532925a3b844Bc454e4438f44e',
            },
        });

        const ethAddress = '0x742d35Cc6634C0532925a3b844Bc454e4438f44e';
        const ethAccountKey = (accountEth as unknown as Account).key;
        const inputSameFormatLeakEthToBsc = overrideInput({
            formValues: {
                receiveCryptoSelect: {
                    id: 'binancecoin' as CryptoId,
                    isNativeToken: true,
                    name: 'BNB Smart Chain',
                    coingeckoId: 'binance-smart-chain',
                    contractAddress: null,
                    symbol: bscSymbol,
                    displaySymbol: 'BNB',
                    networkName: 'BNB Smart Chain',
                    networkSymbol: bscSymbol,
                } satisfies TradingAssetOption,
                receiveAddress: ethAddress,
                receiveAccountKey: ethAccountKey,
            },
        });

        const inputSameFormatLeakEthToEtc = overrideInput({
            formValues: {
                receiveCryptoSelect: {
                    id: 'ethereum-classic' as CryptoId,
                    isNativeToken: true,
                    name: 'Ethereum Classic',
                    coingeckoId: 'ethereum-classic',
                    contractAddress: null,
                    symbol: etcSymbol,
                    displaySymbol: 'ETC',
                    networkName: 'Ethereum Classic',
                    networkSymbol: etcSymbol,
                } satisfies TradingAssetOption,
                receiveAddress: ethAddress,
                receiveAccountKey: ethAccountKey,
            },
        });

        const inputAccountKeyMissing = overrideInput({
            formValues: {
                receiveAddress: ethAddress,
                receiveAccountKey: 'nonexistent-key' as AccountKey,
            },
        });
        const inputMatchingAccountKeyInvalidAddress = overrideInput({
            formValues: {
                receiveAddress: 'not-valid-eth-address',
                receiveAccountKey: ethAccountKey,
            },
        });
        const inputUnknownReceiveSymbol = overrideInput({
            formValues: {
                receiveCryptoSelect: {
                    ...input.formValues.receiveCryptoSelect!,
                    id: 'unknown-coin' as CryptoId,
                },
                receiveAddress: ethAddress,
            },
        });

        it.each([
            ['output amount is incorrect', inputAmountIncorrect],
            ['receiveCryptoSelect is not selected', inputReceiveCryptoSelectIncorrect],
            ['sendCryptoSelect is not selected', inputSendCryptoSelectIncorrect],
            ['cross-format stale leak ETH to BTC (#28143)', inputCrossFormatLeak],
            ['same-format stale leak ETH to BSC (#28143)', inputSameFormatLeakEthToBsc],
            ['same-format stale leak ETH to ETC (#28143)', inputSameFormatLeakEthToEtc],
            [
                'receiveAccountKey provided but account no longer in state (#28143)',
                inputAccountKeyMissing,
            ],
            [
                'receiveAccountKey matches but receiveAddress is invalid for symbol (#28143)',
                inputMatchingAccountKeyInvalidAddress,
            ],
            ['receiveAddress provided for unknown receive symbol', inputUnknownReceiveSymbol],
        ])(`%s`, async (_description, formValues) => {
            const promise = store.dispatch(exchangeThunks.handleRequestThunk(formValues));

            await promise;

            const state = store.getState().wallet.trading;

            expect(state.exchange.quotesRequest).toBeUndefined();
            expect(state.exchange.quotes.length).toEqual(0);
            expect(state.isLoading).toBe(false);
            await expect(() => promise.unwrap()).rejects.toEqual('Invalid request data');
        });
    });

    it('should not save quotes, when request is aborted', async () => {
        const { input, store } = getMocks();

        tradeApi.getExchangeQuotes = () => Promise.resolve([]);

        const promise = store.dispatch(exchangeThunks.handleRequestThunk(input));

        promise.abort();

        await promise;

        const state = store.getState().wallet.trading;

        expect(state.exchange.quotes.length).toEqual(0);
        expect(state.exchange.quotesRequest).toBeUndefined();
        expect(state.isLoading).toBe(false);
    });

    it('should accept a receiveAddress whose receiveAccountKey resolves to a matching-symbol account (#28143)', async () => {
        const { input, store } = getMocks();
        const mockQuotes = cloneExchangeQuotes();

        tradeApi.getExchangeQuotes = () => Promise.resolve(mockQuotes);

        const ethAccountKey = (accountEth as unknown as Account).key;
        const quotesResponse = await store
            .dispatch(
                exchangeThunks.handleRequestThunk({
                    ...input,
                    formValues: {
                        ...input.formValues,
                        receiveAddress: '0x742d35Cc6634C0532925a3b844Bc454e4438f44e',
                        receiveAccountKey: ethAccountKey,
                    },
                }),
            )
            .unwrap();

        expect(quotesResponse?.length).toEqual(11);
        expect(store.getState().wallet.trading.exchange.quotes.length).toEqual(11);
    });

    it('should accept an ETH-format receiveAddress with no account key against an ETH receive symbol (#28143)', async () => {
        const { input, store } = getMocks();
        const mockQuotes = cloneExchangeQuotes();

        tradeApi.getExchangeQuotes = () => Promise.resolve(mockQuotes);

        const quotesResponse = await store
            .dispatch(
                exchangeThunks.handleRequestThunk({
                    ...input,
                    formValues: {
                        ...input.formValues,
                        receiveAddress: '0x742d35Cc6634C0532925a3b844Bc454e4438f44e',
                    },
                }),
            )
            .unwrap();

        expect(quotesResponse?.length).toEqual(11);
    });

    it('should not save quotes when empty array is returned from the response', async () => {
        const { input, store } = getMocks();

        tradeApi.getExchangeQuotes = () => Promise.resolve([]);

        const quotesResponse = await store
            .dispatch(exchangeThunks.handleRequestThunk(input))
            .unwrap();

        const state = store.getState().wallet.trading;

        expect(state.exchange.quotes.length).toEqual(0);
        expect(state.exchange.quotesRequest).toBeUndefined();
        expect(state.isLoading).toBe(false);
        expect(quotesResponse).toEqual([]);
    });
});
