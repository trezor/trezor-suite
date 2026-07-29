import { type Resolver, useForm } from 'react-hook-form';

import { act, waitFor } from '@testing-library/react';
import type { BuyTrade, CryptoId } from 'invity-api';

import { configureMockStore, renderHookWithStoreProvider } from '@suite-common/test-utils';
import {
    type TradingAssetOption,
    type TradingBuyFormProps,
    type TradingCountryOption,
    buyInitialState,
    initialState as tradingInitialState,
} from '@suite-common/trading';
import { getNetwork } from '@suite-common/wallet-config';

import { useBuyQuotes } from './useBuyQuotes';
import { DEBOUNCE_DELAY_MS } from '../common/useTradingQuoteRequest';

const QUOTES: BuyTrade[] = [
    {
        paymentMethod: 'creditCard',
        paymentMethodName: 'Credit card',
        exchange: 'provider-1',
        rate: 1,
    },
    {
        paymentMethod: 'bankTransfer',
        paymentMethodName: 'Bank transfer',
        exchange: 'provider-2',
        rate: 2,
    },
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

const NO_REFETCH_WAIT_MS = DEBOUNCE_DELAY_MS + 200;

const wait = (ms: number) =>
    act(
        () =>
            new Promise<void>(resolve => {
                setTimeout(resolve, ms);
            }),
    );

const renderBuyQuotes = (
    defaultValues: TradingBuyFormProps,
    options: { resolver?: Resolver<TradingBuyFormProps> } = {},
) => {
    const { resolver } = options;
    const store = configureMockStore({
        preloadedState: {
            wallet: {
                trading: {
                    ...tradingInitialState,
                    buy: { ...buyInitialState, quotes: QUOTES },
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
            useBuyQuotes({ methods, network: getNetwork('btc'), shouldSendInSats: false });

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

    it('does not refetch when only a non-key field (provider) changes', async () => {
        const { result } = renderBuyQuotes(VALID_DEFAULTS);

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
        const invalidResolver: Resolver<TradingBuyFormProps> = () => ({
            values: {},
            errors: { fiatInput: { type: 'manual', message: 'invalid' } },
        });
        const { result } = renderBuyQuotes(VALID_DEFAULTS, { resolver: invalidResolver });

        await act(async () => {
            await result.current.trigger();
        });
        await wait(NO_REFETCH_WAIT_MS);

        expect(mockHandleRequest).not.toHaveBeenCalled();
    });
});
