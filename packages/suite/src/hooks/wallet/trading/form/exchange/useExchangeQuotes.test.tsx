import { type Resolver, useForm } from 'react-hook-form';

import { act, waitFor } from '@testing-library/react';
import { type CryptoId, type ExchangeTrade } from 'invity-api';

import { configureMockStore, renderHookWithStoreProvider } from '@suite-common/test-utils';
import {
    TRADING_EXCHANGE_FORM_CEX,
    TRADING_EXCHANGE_FORM_DEX,
    type TradingAssetOption,
    type TradingAssetSellOption,
    type TradingExchangeFormProps,
} from '@suite-common/trading';
import { type Network, type NetworkSymbol, getNetwork } from '@suite-common/wallet-config';
import { mockAccountKey } from '@suite-common/wallet-types/mocks';

import { useExchangeQuotes } from './useExchangeQuotes';

const QUOTES: ExchangeTrade[] = [
    { exchange: 'provider-1', send: 'bitcoin' as CryptoId, receive: 'ethereum' as CryptoId },
];

const mockAbort = jest.fn();
const mockHandleRequest = jest.fn((payload: unknown) => {
    const thunk = () => ({ abort: mockAbort, unwrap: () => Promise.resolve(QUOTES) });

    return Object.assign(thunk, { payload });
});
const mockSaveSelectedQuote = jest.fn();

let mockDexQuotes: ExchangeTrade[] = [];
let mockCexQuotes: ExchangeTrade[] = [];

jest.mock('@suite-common/dependency-injection', () => ({
    ...jest.requireActual('@suite-common/dependency-injection'),
    useServices: () => ({ analytics: { report: jest.fn() } }),
}));

jest.mock('@suite-common/trading', () => {
    const actual = jest.requireActual('@suite-common/trading');

    return {
        ...actual,
        exchangeThunks: {
            ...actual.exchangeThunks,
            handleRequestThunk: (payload: unknown) => mockHandleRequest(payload),
        },
        tradingExchangeActions: {
            ...actual.tradingExchangeActions,
            saveSelectedQuote: (payload: unknown) => {
                mockSaveSelectedQuote(payload);

                return actual.tradingExchangeActions.saveSelectedQuote(payload);
            },
        },
        selectTradingExchangeDexQuotes: () => mockDexQuotes,
        selectTradingExchangeCexQuotes: () => mockCexQuotes,
    };
});

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

const RECEIVE_CRYPTO_SELECT: TradingAssetOption = {
    id: 'ethereum' as CryptoId,
    isNativeToken: true,
    name: 'Ethereum',
    coingeckoId: 'ethereum',
    contractAddress: null,
    symbol: 'eth',
    displaySymbol: 'ETH',
    networkName: 'Ethereum',
    networkSymbol: 'eth',
};

const VALID_DEFAULTS: TradingExchangeFormProps = {
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
    sendCryptoSelect: SEND_CRYPTO_SELECT,
    receiveCryptoSelect: RECEIVE_CRYPTO_SELECT,
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
};

const wait = (ms: number) =>
    act(
        () =>
            new Promise<void>(resolve => {
                setTimeout(resolve, ms);
            }),
    );

const renderExchangeQuotes = (
    defaultValues: TradingExchangeFormProps,
    options: {
        network?: Network;
        receiveAddress?: string;
        receiveAccountKey?: ReturnType<typeof mockAccountKey>;
        receiveAccountSymbol?: NetworkSymbol;
        resolver?: Resolver<TradingExchangeFormProps>;
    } = {},
) => {
    const { receiveAddress, receiveAccountKey, receiveAccountSymbol, resolver } = options;
    const network = 'network' in options ? options.network : getNetwork('btc');

    const store = configureMockStore({
        preloadedState: {
            wallet: {
                trading: {
                    quoteRefetchingState: { status: 'idle', lastFetchTimestamp: null },
                },
            },
        },
    });

    return renderHookWithStoreProvider(
        ({ currentNetwork, currentReceiveAccountKey }) => {
            const methods = useForm<TradingExchangeFormProps>({
                mode: 'onChange',
                defaultValues,
                resolver,
            });

            const quotes = useExchangeQuotes({
                methods,
                network: currentNetwork,
                shouldSendInSats: false,
                receiveAddress,
                receiveAccountKey: currentReceiveAccountKey,
                receiveAccountSymbol,
                composeRequestCallback: jest.fn(),
            });

            return { methods, quotes };
        },
        {
            store,
            initialProps: {
                currentNetwork: network,
                currentReceiveAccountKey: receiveAccountKey,
            },
        },
    );
};

describe('useExchangeQuotes', () => {
    beforeEach(() => {
        mockHandleRequest.mockClear();
        mockAbort.mockClear();
        mockSaveSelectedQuote.mockClear();
        mockDexQuotes = [];
        mockCexQuotes = [];
    });

    it('dispatches a quotes request after the debounce when the form is valid', async () => {
        const { result } = renderExchangeQuotes(VALID_DEFAULTS, { receiveAddress: '0xreceive' });

        await act(async () => {
            await result.current.methods.trigger();
        });

        await waitFor(() => expect(mockHandleRequest).toHaveBeenCalledTimes(1), { timeout: 1500 });

        expect(mockHandleRequest).toHaveBeenCalledWith(
            expect.objectContaining({
                formValues: expect.objectContaining({ receiveAddress: '0xreceive' }),
                network: expect.objectContaining({ symbol: 'btc' }),
                shouldSendInSats: false,
            }),
        );
    });

    it('does not fetch while the form is invalid', async () => {
        const invalidResolver: Resolver<TradingExchangeFormProps> = () => ({
            values: {},
            errors: { feePerUnit: { type: 'manual', message: 'invalid' } },
        });
        const { result } = renderExchangeQuotes(VALID_DEFAULTS, { resolver: invalidResolver });

        await act(async () => {
            await result.current.methods.trigger();
        });
        await wait(700);

        expect(mockHandleRequest).not.toHaveBeenCalled();
    });

    it('clears the selected quote when the receive crypto changes', async () => {
        const { result } = renderExchangeQuotes(VALID_DEFAULTS, { receiveAddress: '0xreceive' });

        expect(mockSaveSelectedQuote).not.toHaveBeenCalled();

        act(() => {
            result.current.methods.setValue('receiveCryptoSelect', {
                ...RECEIVE_CRYPTO_SELECT,
                id: 'solana' as CryptoId,
            });
        });

        await waitFor(() => expect(mockSaveSelectedQuote).toHaveBeenCalledWith(undefined));
    });

    it('does not dispatch a quotes request while the receive identity is incoherent (#28143/#30213)', async () => {
        const { result } = renderExchangeQuotes(VALID_DEFAULTS, {
            receiveAddress: '0x742d35Cc6634C0532925a3b844Bc454e4438f44e',
            receiveAccountKey: mockAccountKey({ descriptor: 'receiveaccount1', symbol: 'eth' }),
            receiveAccountSymbol: 'eth',
        });

        await act(async () => {
            await result.current.methods.trigger();
        });

        await waitFor(() => expect(mockHandleRequest).toHaveBeenCalledTimes(1), { timeout: 1500 });
        mockHandleRequest.mockClear();
        mockSaveSelectedQuote.mockClear();

        act(() => {
            result.current.methods.setValue('receiveCryptoSelect', {
                ...RECEIVE_CRYPTO_SELECT,
                id: 'binancecoin' as CryptoId,
            });
        });

        await waitFor(() => expect(mockSaveSelectedQuote).toHaveBeenCalledWith(undefined));
        await wait(700);

        expect(mockHandleRequest).not.toHaveBeenCalled();
    });

    it('aborts the in-flight request and clears the loading state when the receive identity becomes incoherent', async () => {
        mockHandleRequest.mockImplementationOnce((payload: unknown) => {
            const thunk = () => ({
                abort: mockAbort,
                unwrap: () => new Promise<ExchangeTrade[]>(() => {}),
            });

            return Object.assign(thunk, { payload });
        });

        const { result } = renderExchangeQuotes(VALID_DEFAULTS, {
            receiveAddress: '0x742d35Cc6634C0532925a3b844Bc454e4438f44e',
            receiveAccountKey: mockAccountKey({ descriptor: 'receiveaccount1', symbol: 'eth' }),
            receiveAccountSymbol: 'eth',
        });

        await act(async () => {
            await result.current.methods.trigger();
        });

        await waitFor(() => expect(mockHandleRequest).toHaveBeenCalledTimes(1), { timeout: 1500 });
        await waitFor(() => expect(result.current.quotes.isScheduledQuotesRefresh).toBe(true));
        expect(mockAbort).not.toHaveBeenCalled();

        act(() => {
            result.current.methods.setValue('receiveCryptoSelect', {
                ...RECEIVE_CRYPTO_SELECT,
                id: 'binancecoin' as CryptoId,
            });
        });

        await waitFor(() => expect(mockAbort).toHaveBeenCalled());
        await waitFor(() => expect(result.current.quotes.isScheduledQuotesRefresh).toBe(false));
    });

    it('clears the selected quote and refetches when only the receive account changes', async () => {
        const { result, rerender } = renderExchangeQuotes(VALID_DEFAULTS, {
            receiveAddress: '0x742d35Cc6634C0532925a3b844Bc454e4438f44e',
            receiveAccountKey: mockAccountKey({ descriptor: 'receiveaccount1', symbol: 'eth' }),
            receiveAccountSymbol: 'eth',
        });

        await act(async () => {
            await result.current.methods.trigger();
        });

        await waitFor(() => expect(mockHandleRequest).toHaveBeenCalledTimes(1), { timeout: 1500 });
        mockHandleRequest.mockClear();
        mockSaveSelectedQuote.mockClear();

        rerender({
            currentNetwork: getNetwork('btc'),
            currentReceiveAccountKey: mockAccountKey({
                descriptor: 'receiveaccount2',
                symbol: 'eth',
            }),
        });

        await waitFor(() => expect(mockSaveSelectedQuote).toHaveBeenCalledWith(undefined));
        await waitFor(() => expect(mockHandleRequest).toHaveBeenCalledTimes(1), { timeout: 1500 });
    });

    it('fetches quotes once the network becomes available again', async () => {
        const { result, rerender } = renderExchangeQuotes(VALID_DEFAULTS, {
            network: undefined,
            receiveAddress: '0xreceive',
        });

        await act(async () => {
            await result.current.methods.trigger();
        });

        await wait(700);

        expect(mockHandleRequest).not.toHaveBeenCalled();

        rerender({
            currentNetwork: getNetwork('btc'),
            currentReceiveAccountKey: undefined,
        });

        await waitFor(() => expect(mockHandleRequest).toHaveBeenCalledTimes(1), { timeout: 1500 });
    });

    it('switches a DEX selection to CEX when only CEX quotes are available', async () => {
        mockCexQuotes = QUOTES;
        mockDexQuotes = [];

        const { result } = renderExchangeQuotes({
            ...VALID_DEFAULTS,
            exchangeType: TRADING_EXCHANGE_FORM_DEX,
        });

        await waitFor(() =>
            expect(result.current.methods.getValues('exchangeType')).toBe(
                TRADING_EXCHANGE_FORM_CEX,
            ),
        );
    });
});
