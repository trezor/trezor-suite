import { type Resolver, useForm } from 'react-hook-form';

import { act, waitFor } from '@testing-library/react';
import { type CryptoId, type SellFiatTrade } from 'invity-api';

import { mockDesktopAnalytics } from '@suite/analytics/mocks';
import { createTestCompositionRoot, renderHookWithStoreProvider } from '@suite-common/test-utils';
import {
    type TradingAssetSellOption,
    type TradingSellFormProps,
    sellInitialState,
    initialState as tradingInitialState,
} from '@suite-common/trading';
import { type Network, getNetwork, toNetworkSymbolNonTestnet } from '@suite-common/wallet-config';
import { mockAccountKey } from '@suite-common/wallet-types/mocks';

import { useSellQuotes } from './useSellQuotes';
import { DEBOUNCE_DELAY_MS } from '../common/useTradingQuoteRequest';

const btcSymbol = toNetworkSymbolNonTestnet('btc');

const QUOTES: SellFiatTrade[] = [
    {
        paymentMethod: 'bankTransfer',
        paymentMethodName: 'Bank transfer',
        exchange: 'provider-1',
        rate: 2,
    },
    {
        paymentMethod: 'creditCard',
        paymentMethodName: 'Credit card',
        exchange: 'provider-2',
        rate: 1,
    },
];

const mockAbort = jest.fn();
const mockHandleRequest = jest.fn((payload: unknown) => {
    const thunk = () => ({ abort: mockAbort, unwrap: () => Promise.resolve(QUOTES) });

    return Object.assign(thunk, { payload });
});
const mockClearQuotes = jest.fn();

jest.mock('@suite-common/trading', () => {
    const actual = jest.requireActual('@suite-common/trading');

    return {
        ...actual,
        sellThunks: {
            ...actual.sellThunks,
            handleRequestThunk: (payload: unknown) => mockHandleRequest(payload),
        },
        tradingSellActions: {
            ...actual.tradingSellActions,
            clearQuotes: () => {
                mockClearQuotes();

                return actual.tradingSellActions.clearQuotes();
            },
        },
    };
});

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

const VALID_DEFAULTS: TradingSellFormProps = {
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
    countrySelect: {
        value: 'CZ' as const,
        codeAlpha3: 'CZE',
        flag: '🇨🇿',
        name: 'Czechia',
        label: '🇨🇿 Czechia',
        shortLabel: '🇨🇿 CZE',
    },
    sendCryptoSelect: SEND_CRYPTO_SELECT,
    amountInCrypto: true,
    paymentMethod: undefined,
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

const NO_REFETCH_WAIT_MS = DEBOUNCE_DELAY_MS + 200;

const wait = (ms: number) =>
    act(
        () =>
            new Promise<void>(resolve => {
                setTimeout(resolve, ms);
            }),
    );

const renderSellQuotes = (
    defaultValues: TradingSellFormProps,
    options: { resolver?: Resolver<TradingSellFormProps> } = {},
) => {
    const { resolver } = options;
    const initialProps: { currentNetwork: Network | undefined } = {
        currentNetwork: getNetwork(btcSymbol),
    };
    const services = { analytics: mockDesktopAnalytics() };

    const root = createTestCompositionRoot({
        extra: { services },
        preloadedState: {
            wallet: {
                trading: {
                    ...tradingInitialState,
                    sell: { ...sellInitialState, quotes: QUOTES },
                },
            },
        },
    });

    return renderHookWithStoreProvider(
        ({ currentNetwork }) => {
            const methods = useForm<TradingSellFormProps>({
                mode: 'onChange',
                defaultValues,
                resolver,
            });
            useSellQuotes({
                methods,
                network: currentNetwork,
                shouldSendInSats: false,
                composeRequestCallback: jest.fn(),
            });

            return methods;
        },
        { root, initialProps },
    );
};

describe('useSellQuotes', () => {
    beforeEach(() => {
        mockHandleRequest.mockClear();
        mockAbort.mockClear();
        mockClearQuotes.mockClear();
    });

    it('dispatches a quotes request after the debounce when the form is valid', async () => {
        const { result } = renderSellQuotes(VALID_DEFAULTS);

        await act(async () => {
            await result.current.trigger();
        });

        await waitFor(() => expect(mockHandleRequest).toHaveBeenCalledTimes(1), { timeout: 1500 });

        expect(mockHandleRequest).toHaveBeenCalledWith(
            expect.objectContaining({
                network: expect.objectContaining({ symbol: 'btc' }),
                shouldSendInSats: false,
            }),
        );
    });

    it('auto-selects the best quote payment method when none is selected', async () => {
        const { result } = renderSellQuotes(VALID_DEFAULTS);

        await act(async () => {
            await result.current.trigger();
        });

        await waitFor(() => expect(mockHandleRequest).toHaveBeenCalledTimes(1), { timeout: 1500 });
        await waitFor(() =>
            expect(result.current.getValues('paymentMethod')).toEqual({
                value: 'bankTransfer',
                label: 'Bank transfer',
            }),
        );
    });

    it('refetches immediately (without the debounce) when a select field changes', async () => {
        const { result } = renderSellQuotes(VALID_DEFAULTS);

        await act(async () => {
            await result.current.trigger();
        });
        await waitFor(() => expect(mockHandleRequest).toHaveBeenCalledTimes(1), { timeout: 1500 });

        await act(async () => {
            result.current.setValue('outputs.0.currency', { value: 'eur', label: 'EUR' });
            await result.current.trigger();
        });

        await waitFor(() => expect(mockHandleRequest).toHaveBeenCalledTimes(2), { timeout: 200 });
    });

    it('does not refetch on an output-fiat edit but does on the synced output-amount edit', async () => {
        const { result } = renderSellQuotes(VALID_DEFAULTS);

        await act(async () => {
            await result.current.trigger();
        });
        await waitFor(() => expect(mockHandleRequest).toHaveBeenCalledTimes(1), { timeout: 1500 });

        await act(async () => {
            result.current.setValue('outputs.0.fiat', '99');
            await result.current.trigger();
        });
        await wait(NO_REFETCH_WAIT_MS);
        expect(mockHandleRequest).toHaveBeenCalledTimes(1);

        await act(async () => {
            result.current.setValue('outputs.0.amount', '0.003');
            await result.current.trigger();
        });
        await waitFor(() => expect(mockHandleRequest).toHaveBeenCalledTimes(2), { timeout: 1500 });
    });

    it('does not refetch when only a non-key field (provider) changes', async () => {
        const { result } = renderSellQuotes(VALID_DEFAULTS);

        await act(async () => {
            await result.current.trigger();
        });
        await waitFor(() => expect(mockHandleRequest).toHaveBeenCalledTimes(1), { timeout: 1500 });

        await act(async () => {
            result.current.setValue('provider', 'provider-2');
            await result.current.trigger();
        });
        await wait(NO_REFETCH_WAIT_MS);

        expect(mockHandleRequest).toHaveBeenCalledTimes(1);
    });

    it('does not fetch while the form is invalid', async () => {
        const invalidResolver: Resolver<TradingSellFormProps> = () => ({
            values: {},
            errors: { feePerUnit: { type: 'manual', message: 'invalid' } },
        });
        const { result } = renderSellQuotes(VALID_DEFAULTS, { resolver: invalidResolver });

        await act(async () => {
            await result.current.trigger();
        });
        await wait(NO_REFETCH_WAIT_MS);

        expect(mockHandleRequest).not.toHaveBeenCalled();
    });

    it('clears quotes eagerly when the network becomes undefined', async () => {
        const { rerender } = renderSellQuotes(VALID_DEFAULTS);

        await waitFor(() => expect(mockHandleRequest).toHaveBeenCalledTimes(1), { timeout: 1500 });
        expect(mockClearQuotes).not.toHaveBeenCalled();

        rerender({ currentNetwork: undefined });

        await waitFor(() => expect(mockClearQuotes).toHaveBeenCalled());
    });
});
