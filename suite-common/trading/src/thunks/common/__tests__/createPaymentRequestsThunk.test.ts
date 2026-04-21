import { combineReducers } from '@reduxjs/toolkit';
import { type CryptoId, type ExchangeTradeSigned } from 'invity-api';

import { createThunk } from '@suite-common/redux-utils';
import { configureMockStore, extraDependenciesCommonMock } from '@suite-common/test-utils';
import { type Account, type GeneralPrecomposedTransaction } from '@suite-common/wallet-types';
import TrezorConnect, { type Address, type PROTO } from '@trezor/connect';
import { validatePath } from '@trezor/connect/src/utils/pathUtils';

import { invityAPI } from '../../../invityAPI';
import { initialState } from '../../../reducers/tradingCommonReducer';
import { prepareTradingReducer } from '../../../reducers/tradingReducer';
import { createPaymentRequestsThunk } from '../createPaymentRequestsThunk';
import { getNonce } from '../getNonce';
import { getPurchaseAddress } from '../getPurchaseAddress';
import { getRefundAddress } from '../getRefundAddress';

const tradingReducer = prepareTradingReducer(extraDependenciesCommonMock);

// Mock internal thunks - this is the key change from the previous approach
jest.mock('../getNonce', () => ({
    getNonce: jest.fn(),
}));

jest.mock('../getRefundAddress', () => ({
    getRefundAddress: jest.fn(),
}));

jest.mock('../getPurchaseAddress', () => ({
    getPurchaseAddress: jest.fn(),
}));

jest.mock('../../../utils/signature/signatureUtils', () => {
    const originalModule = jest.requireActual('../../../utils/signature/signatureUtils');

    return {
        __esModule: true,
        ...originalModule,
        tradingGetCoinSlip44: jest.fn(),
    };
});

// Mock invityAPI
jest.mock('../../../invityAPI', () => ({
    invityAPI: {
        getSignedTrade: jest.fn(),
    },
}));

jest.mock('@trezor/connect', () => ({
    ...jest.requireActual('@trezor/connect'),
    getAddress: jest.fn(),
}));

describe('createPaymentRequestsThunk', () => {
    const mockAccount: Account = {
        deviceState: 'device-state@device-id:123',
        index: 0,
        path: "m/44'/0'/0'",
        descriptor: 'xpub123',
        key: 'account-key',
        accountType: 'normal',
        symbol: 'btc',
        empty: false,
        visible: true,
        balance: '1000000',
        availableBalance: '1000000',
        formattedBalance: '0.01',
        tokens: [],
        addresses: {
            change: [],
            used: [],
            unused: [],
        },
        utxo: [],
        history: {
            total: 0,
            tokens: 0,
            unconfirmed: 0,
            transactions: undefined,
        },
        misc: {},
        page: {
            index: 1,
            size: 25,
            total: 1,
        },
        marker: undefined,
        backendType: 'blockbook',
        networkType: 'bitcoin',
    } as any;

    const mockComposedTransaction: GeneralPrecomposedTransaction = {
        type: 'final',
        totalSpent: '100000',
        fee: '1000',
        feePerByte: '10',
        bytes: 250,
        outputs: [
            {
                address: '1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa',
                amount: '50000',
                script_type: 'PAYTOADDRESS',
            },
            {
                address_n: [44 | 0x80000000, 0 | 0x80000000, 0 | 0x80000000, 1, 0],
                amount: '49000',
                script_type: 'PAYTOADDRESS',
            },
        ],
    } as any;

    const mockExchangeInfo = {
        providerInfos: {
            changelly: {
                name: 'changelly',
                companyName: 'Changelly',
                logo: 'changelly-logo.png',
                isActive: true,
                isFixedRate: false,
                isDex: false,
                buyTickers: [],
                sellTickers: [],
                addressFormats: {},
                statusUrl: 'https://test.io/exchange/txs/{{orderId}}',
                kycUrl: 'https://test.io/faq#kyc',
                supportUrl: 'https://support.test.io',
                kycPolicy: 'KYC is required',
                kycPolicyType: 'KYC-required',
            },
        },
    };

    const mockSellQuote = {
        paymentId: 'sell-payment-123',
        cryptoCurrency: 'bitcoin' as CryptoId,
        fiatCurrency: 'USD',
        cryptoStringAmount: '0.001',
        fiatStringAmount: '50',
        exchange: 'coinbase',
        refundAddress: 'refundAddress',
    };

    const mockSellProviders = {
        providerInfos: {
            coinbase: {
                companyName: 'Coinbase',
                logo: 'coinbase-logo.png',
                isActive: true,
                tradedCoins: [],
                tradedFiatCurrencies: [],
                supportedCountries: [],
                flow: 'DEFAULT' as const,
            },
        },
    };

    const mockSignedSellTrade = {
        ...mockSellQuote,
        refundAddress: '1RefundAddress789',
        tradeSignature: 'sell-signature123',
    };

    const mockNonce = 'test-nonce-123';
    const mockMac = 'test-mac-456';
    const mockInfoCoins = {
        coins: {
            bitcoin: {
                symbol: 'BTC',
                name: 'Bitcoin',
                decimals: 8,
            },
        },
    };

    beforeEach(() => {
        jest.clearAllMocks();

        (getNonce as unknown as jest.Mock).mockImplementation(
            createThunk(getNonce.typePrefix, (_, { fulfillWithValue }) =>
                fulfillWithValue(mockNonce),
            ),
        );

        (getRefundAddress as unknown as jest.Mock).mockImplementation(
            createThunk(getRefundAddress.typePrefix, (_, { fulfillWithValue }) =>
                fulfillWithValue({
                    mac: mockMac,
                    path: "m/44'/0'/0'",
                }),
            ),
        );

        (getPurchaseAddress as unknown as jest.Mock).mockImplementation(
            createThunk(getPurchaseAddress.typePrefix, (_, { fulfillWithValue }) =>
                fulfillWithValue({
                    mac: mockMac,
                    path: "m/84'/2'/0'",
                }),
            ),
        );

        (TrezorConnect.getAddress as jest.Mock).mockResolvedValue({
            success: true,
            payload: { address: '1BvBMSEYstWetqTFn5Au4m4GFg7xJaNVN2' } as Address,
        });
    });

    const createMockStore = (preloadedState = {}) =>
        configureMockStore({
            extra: extraDependenciesCommonMock,
            reducer: combineReducers({
                wallet: combineReducers({
                    trading: tradingReducer,
                    accounts: () => [mockAccount],
                }),
            }),
            preloadedState: {
                wallet: {
                    accounts: [mockAccount],
                    trading: {
                        ...initialState,
                        info: {
                            coins: {
                                litecoin: {
                                    symbol: 'LTC',
                                },
                            },
                        },
                        ...preloadedState,
                    },
                },
            },
        });

    describe('exchange flow', () => {
        const mockExchangeQuote = {
            orderId: 'exchange-order-123',
            send: 'bitcoin' as CryptoId,
            receive: 'litecoin' as CryptoId,
            sendStringAmount: '0.001',
            receiveStringAmount: '0.05',
            exchange: 'changelly',
            receiveAddress: '1ReceiveAddress123',
            refundAddress: '1RefundAddress456',
        };

        const mockSignedExchangeTrade: ExchangeTradeSigned = {
            ...mockExchangeQuote,
            receiveAddress: '1ReceiveAddress123',
            refundAddress: '1RefundAddress456',
            tradeSignature: 'signature123',
        };

        const mockPaymentRequest: PROTO.PaymentRequest = {
            recipient_name: 'Changelly',
            amount: '100000', // decimal subunits (satoshis), encoded to LE bytes by @trezor/connect
            nonce: mockNonce,
            signature: 'signature123',
            memos: [
                {
                    coin_purchase_memo: {
                        address: '1ReceiveAddress123',
                        amount: '0.05 LTC',
                        coin_type: 2,
                        mac: 'test-mac-456',
                        address_n: validatePath("m/84'/2'/0'"),
                    },
                },
                {
                    refund_memo: {
                        address: '1RefundAddress456',
                        mac: mockMac,
                        address_n: validatePath("m/44'/0'/0'"),
                    },
                },
            ],
        };

        it('should successfully create payment request for exchange', async () => {
            invityAPI.getSignedTrade = () => Promise.resolve(mockSignedExchangeTrade as any);

            const store = createMockStore({
                exchange: {
                    selectedQuote: mockExchangeQuote,
                    exchangeInfo: mockExchangeInfo,
                    receiveAccountKey: mockAccount.key,
                    receiveAddress: mockExchangeQuote.receiveAddress,
                },
            });

            // Execute thunk
            const result = await store.dispatch(
                createPaymentRequestsThunk({
                    type: 'exchange',
                    account: mockAccount,
                    composedLevels: mockComposedTransaction,
                    formattedMaxAmount: mockExchangeQuote.sendStringAmount,
                }),
            );

            // Verify success
            expect(result.type).toBe(createPaymentRequestsThunk.fulfilled.type);
            expect(result.payload).toEqual([mockPaymentRequest]);
        });

        it('should reject when exchange quote is missing orderId', async () => {
            const store = createMockStore({
                exchange: {
                    selectedQuote: { ...mockExchangeQuote, orderId: undefined },
                    exchangeInfo: mockExchangeInfo,
                    receiveAccountKey: mockAccount.key,
                    receiveAddress: mockExchangeQuote.receiveAddress,
                },
            });

            const result = await store.dispatch(
                createPaymentRequestsThunk({
                    type: 'exchange',
                    account: mockAccount,
                    composedLevels: mockComposedTransaction,
                    formattedMaxAmount: mockExchangeQuote.sendStringAmount,
                }),
            );

            expect(result.type).toBe(createPaymentRequestsThunk.rejected.type);
            expect(result.payload).toEqual({
                type: 'sign-tx-error',
                error: { id: 'TR_PAYMENT_REQUESTS_ERROR' },
            });
        });

        it('should reject when receive account is missing', async () => {
            const store = createMockStore({
                exchange: {
                    selectedQuote: mockExchangeQuote,
                    exchangeInfo: mockExchangeInfo,
                    receiveAccountKey: undefined, // missing
                },
            });

            const result = await store.dispatch(
                createPaymentRequestsThunk({
                    type: 'exchange',
                    account: mockAccount,
                    composedLevels: mockComposedTransaction,
                    formattedMaxAmount: mockExchangeQuote.sendStringAmount,
                }),
            );

            expect(result.type).toBe(createPaymentRequestsThunk.rejected.type);
            expect(result.payload).toEqual({
                type: 'sign-tx-error',
                error: { id: 'TR_PAYMENT_REQUESTS_ERROR' },
            });
        });

        it('should reject when signed trade is not retrieved', async () => {
            invityAPI.getSignedTrade = () => Promise.resolve(null as any);

            const store = createMockStore({
                exchange: {
                    selectedQuote: mockExchangeQuote,
                    exchangeInfo: mockExchangeInfo,
                    receiveAccountKey: mockAccount.key,
                    receiveAddress: mockExchangeQuote.receiveAddress,
                },
            });

            const result = await store.dispatch(
                createPaymentRequestsThunk({
                    type: 'exchange',
                    account: mockAccount,
                    composedLevels: mockComposedTransaction,
                    formattedMaxAmount: mockExchangeQuote.sendStringAmount,
                }),
            );

            expect(result.type).toBe(createPaymentRequestsThunk.rejected.type);
            expect(result.payload).toEqual({
                type: 'sign-tx-error',
                error: { id: 'TR_PAYMENT_REQUESTS_ERROR' },
            });
        });

        it('should reject when payment request creation errors', async () => {
            invityAPI.getSignedTrade = () =>
                Promise.resolve({
                    mockExchangeQuote,
                    receiveAddress: undefined, // should be filled
                } as any);

            const store = createMockStore({
                exchange: {
                    selectedQuote: {
                        ...mockExchangeQuote,
                    },
                    exchangeInfo: mockExchangeInfo,
                    receiveAccountKey: mockAccount.key,
                    receiveAddress: mockExchangeQuote.receiveAddress,
                },
            });

            const result = await store.dispatch(
                createPaymentRequestsThunk({
                    type: 'exchange',
                    account: mockAccount,
                    composedLevels: mockComposedTransaction,
                    formattedMaxAmount: mockExchangeQuote.sendStringAmount,
                }),
            );

            expect(result.type).toBe(createPaymentRequestsThunk.rejected.type);
            expect(result.payload).toEqual({
                type: 'sign-tx-error',
                error: { id: 'TR_PAYMENT_REQUESTS_ERROR' },
            });
        });
    });

    describe('sell flow', () => {
        const mockSellPaymentRequest: PROTO.PaymentRequest = {
            recipient_name: 'Coinbase',
            amount: '100000', // decimal subunits (satoshis), encoded to LE bytes by @trezor/connect
            nonce: mockNonce,
            signature: 'sell-signature123',
            memos: [
                {
                    text_memo: {
                        text: 'Selling 0.001 BTC for 50 USD',
                    },
                },
                {
                    refund_memo: {
                        address: '1RefundAddress789',
                        mac: mockMac,
                        address_n: validatePath("m/44'/0'/0'"),
                    },
                },
            ],
        };

        it('should successfully create payment request for sell', async () => {
            // Setup mocks
            invityAPI.getSignedTrade = () => Promise.resolve(mockSignedSellTrade as any);

            const store = createMockStore({
                sell: {
                    selectedQuote: mockSellQuote,
                    sellInfo: mockSellProviders,
                },
                info: mockInfoCoins,
            });

            // Execute thunk
            const result = await store.dispatch(
                createPaymentRequestsThunk({
                    type: 'sell',
                    account: mockAccount,
                    composedLevels: mockComposedTransaction,
                    formattedMaxAmount: mockSellQuote.cryptoStringAmount,
                }),
            );

            // Verify success
            expect(result.type).toBe(createPaymentRequestsThunk.fulfilled.type);
            expect(result.payload).toEqual([mockSellPaymentRequest]);
        });

        it('should reject when sell quote is missing paymentId', async () => {
            const store = createMockStore({
                sell: {
                    selectedQuote: { ...mockSellQuote, paymentId: undefined },
                    sellInfo: mockSellProviders,
                },
            });

            const result = await store.dispatch(
                createPaymentRequestsThunk({
                    type: 'sell',
                    account: mockAccount,
                    composedLevels: mockComposedTransaction,
                    formattedMaxAmount: mockSellQuote.cryptoStringAmount,
                }),
            );

            expect(result.type).toBe(createPaymentRequestsThunk.rejected.type);
            expect(result.payload).toEqual({
                type: 'sign-tx-error',
                error: { id: 'TR_PAYMENT_REQUESTS_ERROR' },
            });
        });

        it('should reject when sell payment request creation errors', async () => {
            invityAPI.getSignedTrade = () =>
                Promise.resolve({
                    ...mockSignedSellTrade,
                    refundAddress: undefined,
                } as any);

            const store = createMockStore({
                sell: {
                    selectedQuote: mockSellQuote,
                    sellInfo: mockSellProviders,
                },
                info: mockInfoCoins,
            });

            const result = await store.dispatch(
                createPaymentRequestsThunk({
                    type: 'sell',
                    account: mockAccount,
                    composedLevels: mockComposedTransaction,
                    formattedMaxAmount: mockSellQuote.cryptoStringAmount,
                }),
            );

            expect(result.type).toBe(createPaymentRequestsThunk.rejected.type);
            expect(result.payload).toEqual({
                type: 'sign-tx-error',
                error: { id: 'TR_PAYMENT_REQUESTS_ERROR' },
            });
        });
    });

    describe('composed transaction validation', () => {
        it('should reject when composed transaction has no outputs property', async () => {
            const invalidTransaction = {
                type: 'final' as const,
                totalSpent: '100000',
                fee: '1000',
                // Missing outputs property
            };

            const store = createMockStore();

            const result = await store.dispatch(
                createPaymentRequestsThunk({
                    type: 'exchange',
                    account: mockAccount,
                    composedLevels: invalidTransaction as any,
                    formattedMaxAmount: mockSellQuote.cryptoStringAmount,
                }),
            );

            expect(result.type).toBe(createPaymentRequestsThunk.rejected.type);
            expect(result.payload).toEqual({
                type: 'sign-tx-error',
                error: { id: 'TR_PAYMENT_REQUESTS_ERROR' },
            });
        });
    });

    describe('address resolution', () => {
        it('should process only direct address outputs when no address_n outputs exist', async () => {
            const transactionWithOnlyDirectOutputs: GeneralPrecomposedTransaction = {
                type: 'final',
                totalSpent: '100000',
                fee: '1000',
                feePerByte: '10',
                bytes: 250,
                outputs: [
                    {
                        address: '1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa',
                        amount: '50000',
                        script_type: 'PAYTOADDRESS',
                    },
                    {
                        address: '1BvBMSEYstWetqTFn5Au4m4GFg7xJaNVN2',
                        amount: '49000',
                        script_type: 'PAYTOADDRESS',
                    },
                ],
            } as any;

            invityAPI.getSignedTrade = () => Promise.resolve(mockSignedSellTrade as any);

            const store = createMockStore({
                sell: {
                    selectedQuote: mockSellQuote,
                    sellInfo: mockSellProviders,
                },
                info: mockInfoCoins,
            });

            const result = await store.dispatch(
                createPaymentRequestsThunk({
                    type: 'sell',
                    account: mockAccount,
                    composedLevels: transactionWithOnlyDirectOutputs,
                    formattedMaxAmount: mockSellQuote.cryptoStringAmount,
                }),
            );

            expect(result.type).toBe(createPaymentRequestsThunk.fulfilled.type);
        });
    });

    describe('error handling', () => {
        it('should handle invityAPI.getSignedTrade rejection', async () => {
            invityAPI.getSignedTrade = () => Promise.reject('API request errored');

            const mockExchangeQuote = {
                orderId: 'exchange-order-123',
                send: 'bitcoin' as CryptoId,
                receive: 'litecoin' as CryptoId,
                sendStringAmount: '0.001',
                receiveStringAmount: '0.05',
                exchange: 'changelly',
            };

            const store = createMockStore({
                exchange: {
                    selectedQuote: mockExchangeQuote,
                    exchangeInfo: mockExchangeInfo,
                },
            });

            const result = await store.dispatch(
                createPaymentRequestsThunk({
                    type: 'exchange',
                    account: mockAccount,
                    composedLevels: mockComposedTransaction,
                    formattedMaxAmount: mockSellQuote.cryptoStringAmount,
                }),
            );

            expect(result.meta.requestStatus).toBe('rejected');
        });
    });
});
