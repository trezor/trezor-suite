import { type Resolver, type ResolverResult, useForm } from 'react-hook-form';

import { act, waitFor } from '@testing-library/react';
import type { BuyTrade, CryptoId } from 'invity-api';

import { configureMockStore, renderHookWithStoreProvider } from '@suite-common/test-utils';
import {
    type TradingAssetOption,
    type TradingBuyFormProps,
    type TradingCountryOption,
} from '@suite-common/trading';

import { useBuyQuotes } from './useBuyQuotes';

const QUOTES: BuyTrade[] = [
    { paymentMethod: 'creditCard', paymentMethodName: 'Credit card', exchange: 'provider-1' },
    { paymentMethod: 'bankTransfer', paymentMethodName: 'Bank transfer', exchange: 'provider-2' },
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

jest.mock('src/hooks/wallet/useBitcoinAmountUnit', () => ({
    useBitcoinAmountUnit: () => ({ isBtcSatsAmountUnit: false }),
}));

jest.mock('@suite-common/trading', () => {
    const actual = jest.requireActual('@suite-common/trading');

    return {
        ...actual,
        buyThunks: {
            ...actual.buyThunks,
            handleRequestThunk: (payload: unknown) => mockHandleRequest(payload),
        },
    };
});

const VALID_DEFAULTS: TradingBuyFormProps = {
    fiatInput: '100',
    cryptoInput: '',
    currencySelect: { value: 'eur', label: 'EUR' },
    cryptoSelect: { id: 'bitcoin' as CryptoId, networkSymbol: 'btc' } as TradingAssetOption,
    countrySelect: { value: 'DE', label: 'Germany' } as TradingCountryOption,
    countrySubdivisionSelect: undefined,
    paymentMethod: undefined,
    provider: undefined,
    amountInCrypto: false,
    receiveAddress: 'bc1qreceive',
};

const wait = (ms: number) =>
    act(
        () =>
            new Promise<void>(resolve => {
                setTimeout(resolve, ms);
            }),
    );

const renderBuyQuotes = (
    defaultValues: TradingBuyFormProps,
    resolver?: Resolver<TradingBuyFormProps>,
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
            const methods = useForm<TradingBuyFormProps>({
                mode: 'onChange',
                defaultValues,
                resolver,
            });
            useBuyQuotes({
                control: methods.control,
                getValues: methods.getValues,
                setValue: methods.setValue,
            });

            return methods;
        },
        { store },
    );
};

describe('useBuyQuotes', () => {
    beforeEach(() => {
        mockHandleRequest.mockClear();
        mockAbort.mockClear();
    });

    it('dispatches a quotes request after the debounce when the form is valid', async () => {
        const { result } = renderBuyQuotes(VALID_DEFAULTS);

        await act(async () => {
            await result.current.trigger();
        });

        await waitFor(() => expect(mockHandleRequest).toHaveBeenCalledTimes(1), { timeout: 1500 });

        expect(mockHandleRequest).toHaveBeenCalledWith(
            expect.objectContaining({
                formValues: expect.objectContaining({ fiatInput: '100' }),
                network: expect.objectContaining({ symbol: 'btc' }),
                shouldSendInSats: false,
            }),
        );
    });

    it('auto-selects the best quote payment method when none is selected', async () => {
        const { result } = renderBuyQuotes(VALID_DEFAULTS);

        await act(async () => {
            await result.current.trigger();
        });

        await waitFor(() => expect(mockHandleRequest).toHaveBeenCalledTimes(1), { timeout: 1500 });
        await waitFor(() =>
            expect(result.current.getValues('paymentMethod')).toEqual({
                value: 'creditCard',
                label: 'Credit card',
            }),
        );
    });

    it('refetches when a quote-affecting field changes', async () => {
        const { result } = renderBuyQuotes(VALID_DEFAULTS);

        await act(async () => {
            await result.current.trigger();
        });
        await waitFor(() => expect(mockHandleRequest).toHaveBeenCalledTimes(1), { timeout: 1500 });

        await act(async () => {
            result.current.setValue('fiatInput', '200');
            await result.current.trigger();
        });
        await waitFor(() => expect(mockHandleRequest).toHaveBeenCalledTimes(2), { timeout: 1500 });
    });

    it('refetches immediately (without the debounce) when a select field changes', async () => {
        const { result } = renderBuyQuotes(VALID_DEFAULTS);

        await act(async () => {
            await result.current.trigger();
        });
        await waitFor(() => expect(mockHandleRequest).toHaveBeenCalledTimes(1), { timeout: 1500 });

        await act(async () => {
            result.current.setValue('currencySelect', { value: 'usd', label: 'USD' });
            await result.current.trigger();
        });

        await waitFor(() => expect(mockHandleRequest).toHaveBeenCalledTimes(2), { timeout: 200 });
    });

    it('debounces the refetch when an amount field changes', async () => {
        const { result } = renderBuyQuotes(VALID_DEFAULTS);

        await act(async () => {
            await result.current.trigger();
        });
        await waitFor(() => expect(mockHandleRequest).toHaveBeenCalledTimes(1), { timeout: 1500 });

        await act(async () => {
            result.current.setValue('fiatInput', '200');
            await result.current.trigger();
        });

        await wait(150);
        expect(mockHandleRequest).toHaveBeenCalledTimes(1);

        await waitFor(() => expect(mockHandleRequest).toHaveBeenCalledTimes(2), { timeout: 1500 });
    });

    it('does not refetch when only a non-key field (payment method) changes', async () => {
        const { result } = renderBuyQuotes(VALID_DEFAULTS);

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
        const invalidResolver: Resolver<TradingBuyFormProps> = () => ({
            values: {},
            errors: { fiatInput: { type: 'manual', message: 'invalid' } },
        });
        const { result } = renderBuyQuotes(VALID_DEFAULTS, invalidResolver);

        await act(async () => {
            await result.current.trigger();
        });
        await wait(700);

        expect(mockHandleRequest).not.toHaveBeenCalled();
    });

    it('refetches on invalid → valid recovery even when the values are identical', async () => {
        let isValid = true;
        const resolver: Resolver<TradingBuyFormProps> = (
            values,
        ): ResolverResult<TradingBuyFormProps> => {
            if (isValid) {
                return { values, errors: {} };
            }

            return { values: {}, errors: { fiatInput: { type: 'manual', message: 'invalid' } } };
        };
        const { result } = renderBuyQuotes(VALID_DEFAULTS, resolver);

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
