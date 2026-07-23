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
import { getNetwork } from '@suite-common/wallet-config';
import { mockAccountKey } from '@suite-common/wallet-types/mocks';

import { useExchangeQuotes } from '../useExchangeQuotes';

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
    {
        receiveAddress,
        resolver,
    }: {
        receiveAddress?: string;
        resolver?: Resolver<TradingExchangeFormProps>;
    } = {},
) => {
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
        () => {
            const methods = useForm<TradingExchangeFormProps>({
                mode: 'onChange',
                defaultValues,
                resolver,
            });
            const quotes = useExchangeQuotes({
                control: methods.control,
                getValues: methods.getValues,
                setValue: methods.setValue,
                network: getNetwork('btc'),
                shouldSendInSats: false,
                receiveAddress,
                receiveAccountKey: undefined,
                composeRequestCallback: jest.fn(),
            });

            return { methods, quotes };
        },
        { store },
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

    it('resetSelectedOffer flags a scheduled quotes refresh', () => {
        const { result } = renderExchangeQuotes(VALID_DEFAULTS);

        act(() => {
            result.current.quotes.resetSelectedOffer();
        });

        expect(result.current.quotes.isScheduledQuotesRefresh).toBe(true);
    });
});
