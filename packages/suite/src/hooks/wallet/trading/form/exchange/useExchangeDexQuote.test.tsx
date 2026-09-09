import { useForm } from 'react-hook-form';

import { act, waitFor } from '@testing-library/react';
import { type CryptoId, type ExchangeTrade } from 'invity-api';

import { createTestStore, renderHookWithStoreProvider } from '@suite-common/test-utils';
import {
    TRADING_EXCHANGE_FORM_CEX,
    TRADING_EXCHANGE_FORM_DEX,
    type TradingAssetSellOption,
    type TradingExchangeFormProps,
} from '@suite-common/trading';
import { toNetworkSymbolNonTestnet } from '@suite-common/wallet-config';
import { mockAccountKey, mockWalletAccount } from '@suite-common/wallet-types/mocks';
import { buildApprovalTransactionData } from '@suite-common/wallet-utils';

import { useExchangeDexQuote } from './useExchangeDexQuote';

const mockUpdateFeeInfo = jest.fn(() => () => ({ unwrap: () => Promise.resolve() }));

jest.mock('@suite-common/wallet-core', () => {
    const actual = jest.requireActual('@suite-common/wallet-core');

    return {
        ...actual,
        updateFeeInfoThunk: () => mockUpdateFeeInfo(),
    };
});

const btcSymbol = toNetworkSymbolNonTestnet('btc');
const ACCOUNT = mockWalletAccount({ symbol: btcSymbol, formattedBalance: '2' });

const SEND_CRYPTO_SELECT: TradingAssetSellOption = {
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
};

const DEX_QUOTE: ExchangeTrade = {
    exchange: '1inch',
    send: 'bitcoin' as CryptoId,
    receive: 'ethereum' as CryptoId,
    isDex: true,
    dexTx: {
        from: '0xUserAddress',
        to: '0xDexRouterAddress',
        data: '0xabcdef1234567890',
        value: '1000000000000000000',
    },
};

const DEX_QUOTE_WITHOUT_TRANSACTION: ExchangeTrade = {
    exchange: 'swapkit',
    send: 'bitcoin' as CryptoId,
    receive: 'ethereum' as CryptoId,
    isDex: true,
};

const SELECTED_DEX_QUOTE: ExchangeTrade = {
    exchange: 'lifi',
    send: 'bitcoin' as CryptoId,
    receive: 'ethereum' as CryptoId,
    isDex: true,
    dexTx: {
        from: '0xUserAddress',
        to: '0xSelectedDexRouterAddress',
        data: '0x0987654321fedcba',
        value: '1000000000000000000',
    },
};

const STALE_OUTPUTS: TradingExchangeFormProps['outputs'] = [
    {
        type: 'payment',
        address: '0xstaleAddress',
        amount: '0.1',
        fiat: '',
        currency: { value: 'usd', label: 'USD' },
        token: null,
        label: '',
    },
];

const buildDefaults = (
    overrides: Partial<TradingExchangeFormProps> = {},
): TradingExchangeFormProps => ({
    outputs: [
        {
            type: 'payment',
            address: 'address',
            amount: '0.1',
            fiat: '',
            currency: { value: 'usd', label: 'USD' },
            token: null,
            label: '',
        },
    ],
    sendCryptoSelect: SEND_CRYPTO_SELECT,
    receiveCryptoSelect: null,
    amountInCrypto: true,
    rateType: 'floating',
    exchangeType: TRADING_EXCHANGE_FORM_CEX,
    exchangeComparatorKycFilter: 'all',
    exchangeComparatorRateFilter: 'all',
    provider: undefined,
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
    ...overrides,
});

const mockComposeRequest = jest.fn();

const renderExchangeDexQuote = ({
    defaultValues,
    quotes = [],
    isFormLoading = false,
    isLoadingQuote = false,
}: {
    defaultValues: TradingExchangeFormProps;
    quotes?: ExchangeTrade[];
    isFormLoading?: boolean;
    isLoadingQuote?: boolean;
}) => {
    const store = createTestStore({
        extra: undefined,
        preloadedState: {
            wallet: { trading: { exchange: { quotes } } },
        },
    });

    return renderHookWithStoreProvider(
        () => {
            const methods = useForm<TradingExchangeFormProps>({
                mode: 'onChange',
                defaultValues,
            });
            const dex = useExchangeDexQuote({
                account: ACCOUNT,
                methods,
                isFormLoading,
                isLoadingQuote,
                exchangeType: defaultValues.exchangeType,
                sendCryptoSelect: defaultValues.sendCryptoSelect,
                composeRequest: mockComposeRequest,
            });

            return { dex, methods };
        },
        { store },
    );
};

describe('useExchangeDexQuote', () => {
    beforeEach(() => {
        mockUpdateFeeInfo.mockClear();
        mockComposeRequest.mockClear();
    });

    it('derives transaction data, receive address and gas limit from the active DEX quote', async () => {
        const { result } = renderExchangeDexQuote({
            defaultValues: buildDefaults({ exchangeType: TRADING_EXCHANGE_FORM_DEX }),
            quotes: [DEX_QUOTE],
        });

        await waitFor(() => {
            expect(result.current.methods.getValues('outputs.0.address')).toBe(
                '0xDexRouterAddress',
            );
            expect(result.current.methods.getValues('transactionData')).toBe('0xabcdef1234567890');
            expect(result.current.methods.getValues('ethereumAdjustGasLimit')).toBeDefined();
        });
    });

    it('derives the transaction from the selected quote, not from the best one', async () => {
        const { result } = renderExchangeDexQuote({
            defaultValues: buildDefaults({
                exchangeType: TRADING_EXCHANGE_FORM_DEX,
                provider: SELECTED_DEX_QUOTE.exchange,
            }),
            quotes: [DEX_QUOTE_WITHOUT_TRANSACTION, SELECTED_DEX_QUOTE],
        });

        await waitFor(() => {
            expect(result.current.methods.getValues('outputs.0.address')).toBe(
                '0xSelectedDexRouterAddress',
            );
            expect(result.current.methods.getValues('transactionData')).toBe('0x0987654321fedcba');
            expect(result.current.methods.getValues('ethereumAdjustGasLimit')).toBeDefined();
        });
    });

    it('clears transaction data and receive address when the selected quote has no dexTx', async () => {
        const { result } = renderExchangeDexQuote({
            defaultValues: buildDefaults({
                exchangeType: TRADING_EXCHANGE_FORM_DEX,
                provider: DEX_QUOTE_WITHOUT_TRANSACTION.exchange,
                transactionData: '0xstale',
                outputs: STALE_OUTPUTS,
            }),
            quotes: [DEX_QUOTE_WITHOUT_TRANSACTION, SELECTED_DEX_QUOTE],
        });

        await waitFor(() => {
            expect(result.current.methods.getValues('transactionData')).toBe('');
            expect(result.current.methods.getValues('outputs.0.address')).toBe('');
        });

        expect(result.current.methods.getValues('ethereumAdjustGasLimit')).toBeUndefined();
    });

    it('clears transaction data and receive address for a non-DEX exchange type', async () => {
        const { result } = renderExchangeDexQuote({
            defaultValues: buildDefaults({
                exchangeType: TRADING_EXCHANGE_FORM_CEX,
                transactionData: '0xstale',
                outputs: STALE_OUTPUTS,
            }),
            quotes: [DEX_QUOTE],
        });

        await waitFor(() => {
            expect(result.current.methods.getValues('transactionData')).toBe('');
            expect(result.current.methods.getValues('outputs.0.address')).toBe('');
        });
    });

    it('does not touch the form while the form is loading', async () => {
        const { result } = renderExchangeDexQuote({
            defaultValues: buildDefaults({
                exchangeType: TRADING_EXCHANGE_FORM_DEX,
                outputs: [
                    {
                        type: 'payment',
                        address: 'address',
                        amount: '0.1',
                        fiat: '',
                        currency: { value: 'usd', label: 'USD' },
                        token: null,
                        label: '',
                    },
                ],
            }),
            quotes: [DEX_QUOTE],
            isFormLoading: true,
        });

        await new Promise(resolve => {
            setTimeout(resolve, 100);
        });

        expect(result.current.methods.getValues('outputs.0.address')).toBe('address');
    });

    it('fetchFeesAndCompose refreshes fees and recomposes', async () => {
        const { result } = renderExchangeDexQuote({
            defaultValues: buildDefaults(),
        });

        mockUpdateFeeInfo.mockClear();
        mockComposeRequest.mockClear();

        await act(async () => {
            await result.current.dex.fetchFeesAndCompose();
        });

        expect(mockUpdateFeeInfo).toHaveBeenCalled();
        expect(mockComposeRequest).toHaveBeenCalled();
    });

    it('recomposes when an approval transaction changes to a revoke transaction', async () => {
        const spender = '0x1231deb6f5749ef6ce6943a275a1d3e7486f4eae';
        const approvalTransactionData = buildApprovalTransactionData({
            spender,
            amount: '9475047',
        });
        const revokeTransactionData = buildApprovalTransactionData({ spender, amount: '0' });
        const { result } = renderExchangeDexQuote({
            defaultValues: buildDefaults(),
        });

        await waitFor(() => {
            expect(mockComposeRequest).toHaveBeenCalled();
        });
        mockUpdateFeeInfo.mockClear();
        mockComposeRequest.mockClear();

        act(() => {
            result.current.methods.setValue('transactionData', approvalTransactionData);
        });
        await waitFor(() => {
            expect(mockComposeRequest).toHaveBeenCalled();
        });
        mockUpdateFeeInfo.mockClear();
        mockComposeRequest.mockClear();

        act(() => {
            result.current.methods.setValue('transactionData', revokeTransactionData);
        });

        await waitFor(() => {
            expect(mockUpdateFeeInfo).toHaveBeenCalledTimes(1);
            expect(mockComposeRequest).toHaveBeenCalledTimes(1);
        });
    });
});
