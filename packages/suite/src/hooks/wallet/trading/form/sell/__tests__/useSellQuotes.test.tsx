import { type Resolver, type ResolverResult, useForm } from 'react-hook-form';

import { act, waitFor } from '@testing-library/react';
import { type CryptoId, type SellFiatTrade } from 'invity-api';

import { configureMockStore, renderHookWithStoreProvider } from '@suite-common/test-utils';
import { type TradingAssetSellOption, type TradingSellFormProps } from '@suite-common/trading';
import { getNetwork } from '@suite-common/wallet-config';
import { mockAccountKey } from '@suite-common/wallet-types/mocks';

import { useSellQuotes } from '../useSellQuotes';

const QUOTES: SellFiatTrade[] = [
    { paymentMethod: 'bankTransfer', paymentMethodName: 'Bank transfer', exchange: 'provider-1' },
    { paymentMethod: 'creditCard', paymentMethodName: 'Credit card', exchange: 'provider-2' },
];

const mockAbort = jest.fn();
const mockHandleRequest = jest.fn((payload: unknown) => {
    const thunk = () => ({ abort: mockAbort, unwrap: () => Promise.resolve(QUOTES) });

    return Object.assign(thunk, { payload });
});

jest.mock('@suite-common/dependency-injection', () => ({
    ...jest.requireActual('@suite-common/dependency-injection'),
    useServices: () => ({ analytics: { report: jest.fn() } }),
}));

jest.mock('@suite-common/trading', () => {
    const actual = jest.requireActual('@suite-common/trading');

    return {
        ...actual,
        sellThunks: {
            ...actual.sellThunks,
            handleRequestThunk: (payload: unknown) => mockHandleRequest(payload),
        },
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

const wait = (ms: number) =>
    act(
        () =>
            new Promise<void>(resolve => {
                setTimeout(resolve, ms);
            }),
    );

const renderSellQuotes = (
    defaultValues: TradingSellFormProps,
    resolver?: Resolver<TradingSellFormProps>,
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
            const methods = useForm<TradingSellFormProps>({
                mode: 'onChange',
                defaultValues,
                resolver,
            });
            useSellQuotes({
                control: methods.control,
                getValues: methods.getValues,
                setValue: methods.setValue,
                network: getNetwork('btc'),
                shouldSendInSats: false,
                composeRequestCallback: jest.fn(),
            });

            return methods;
        },
        { store },
    );
};

describe('useSellQuotes', () => {
    beforeEach(() => {
        mockHandleRequest.mockClear();
        mockAbort.mockClear();
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

    it('debounces the refetch when the crypto amount changes', async () => {
        const { result } = renderSellQuotes(VALID_DEFAULTS);

        await act(async () => {
            await result.current.trigger();
        });
        await waitFor(() => expect(mockHandleRequest).toHaveBeenCalledTimes(1), { timeout: 1500 });

        await act(async () => {
            result.current.setValue('outputs.0.amount', '0.003');
            await result.current.trigger();
        });

        await wait(150);
        expect(mockHandleRequest).toHaveBeenCalledTimes(1);

        await waitFor(() => expect(mockHandleRequest).toHaveBeenCalledTimes(2), { timeout: 1500 });
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
        await wait(700);

        expect(mockHandleRequest).toHaveBeenCalledTimes(1);
    });

    it('does not fetch while the form is invalid', async () => {
        const invalidResolver: Resolver<TradingSellFormProps> = () => ({
            values: {},
            errors: { feePerUnit: { type: 'manual', message: 'invalid' } },
        });
        const { result } = renderSellQuotes(VALID_DEFAULTS, invalidResolver);

        await act(async () => {
            await result.current.trigger();
        });
        await wait(700);

        expect(mockHandleRequest).not.toHaveBeenCalled();
    });

    it('refetches on invalid → valid recovery even when the values are identical', async () => {
        let isValid = true;
        const resolver: Resolver<TradingSellFormProps> = (
            values,
        ): ResolverResult<TradingSellFormProps> => {
            if (isValid) {
                return { values, errors: {} };
            }

            return { values: {}, errors: { feePerUnit: { type: 'manual', message: 'invalid' } } };
        };
        const { result } = renderSellQuotes(VALID_DEFAULTS, resolver);

        await act(async () => {
            await result.current.trigger();
        });
        await waitFor(() => expect(mockHandleRequest).toHaveBeenCalledTimes(1), { timeout: 1500 });

        isValid = false;
        await act(async () => {
            await result.current.trigger();
        });
        await wait(700);
        expect(mockHandleRequest).toHaveBeenCalledTimes(1);

        isValid = true;
        await act(async () => {
            await result.current.trigger();
        });
        await waitFor(() => expect(mockHandleRequest).toHaveBeenCalledTimes(2), { timeout: 1500 });
    });
});
