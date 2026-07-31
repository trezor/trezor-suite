import { useForm } from 'react-hook-form';

import { act, waitFor } from '@testing-library/react';
import { type CryptoId, type ExchangeTrade } from 'invity-api';

import { configureMockStore, renderHookWithStoreProvider } from '@suite-common/test-utils';
import {
    TRADING_EXCHANGE_FORM_CEX,
    TRADING_EXCHANGE_FORM_DEX,
    type TradingAssetSellOption,
    type TradingExchangeFormProps,
} from '@suite-common/trading';
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

const ACCOUNT = mockWalletAccount({ symbol: 'btc', formattedBalance: '2' });

const SEND_CRYPTO_SELECT: TradingAssetSellOption = {
    id: 'bitcoin' as CryptoId,
    isNativeToken: true,
    name: 'Bitcoin',
    coingeckoId: 'bitcoin',
    contractAddress: null,
    symbol: 'btc',
    displaySymbol: 'BTC',
    networkName: 'Bitcoin',
    networkSymbol: 'btc',
    accountKey: mockAccountKey({ descriptor: 'descriptor123', symbol: 'btc' }),
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
    dexQuotes = [],
    isFormLoading = false,
    isLoadingQuote = false,
}: {
    defaultValues: TradingExchangeFormProps;
    dexQuotes?: ExchangeTrade[];
    isFormLoading?: boolean;
    isLoadingQuote?: boolean;
}) => {
    const store = configureMockStore();

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
                selectedQuote: undefined,
                dexQuotes,
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
            dexQuotes: [DEX_QUOTE],
        });

        await waitFor(() => {
            expect(result.current.methods.getValues('outputs.0.address')).toBe(
                '0xDexRouterAddress',
            );
            expect(result.current.methods.getValues('transactionData')).toBe('0xabcdef1234567890');
            expect(result.current.methods.getValues('ethereumAdjustGasLimit')).toBeDefined();
        });
    });

    it('clears transaction data and receive address for a non-DEX exchange type', async () => {
        const { result } = renderExchangeDexQuote({
            defaultValues: buildDefaults({
                exchangeType: TRADING_EXCHANGE_FORM_CEX,
                transactionData: '0xstale',
                outputs: [
                    {
                        type: 'payment',
                        address: '0xstaleAddress',
                        amount: '0.1',
                        fiat: '',
                        currency: { value: 'usd', label: 'USD' },
                        token: null,
                        label: '',
                    },
                ],
            }),
            dexQuotes: [DEX_QUOTE],
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
            dexQuotes: [DEX_QUOTE],
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
