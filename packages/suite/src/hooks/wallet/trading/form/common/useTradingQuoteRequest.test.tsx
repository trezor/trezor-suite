import { useForm } from 'react-hook-form';

import { act, waitFor } from '@testing-library/react';

import { createTestCompositionRoot, renderHookWithStoreProvider } from '@suite-common/test-utils';
import { initialState as tradingInitialState } from '@suite-common/trading';

import { DEBOUNCE_DELAY_MS, useTradingQuoteRequest } from './useTradingQuoteRequest';

type TestFormValues = {
    amount: string;
    fiat: string;
    amountInCrypto: boolean;
    asset: string;
    fee: string;
};

type TestField = keyof TestFormValues;

const IMMEDIATE_FIELDS = ['asset'] as const;
const DEBOUNCED_FIELDS = ['amount', 'fiat', 'amountInCrypto'] as const;

const getActiveAmountField = (values: TestFormValues) =>
    values.amountInCrypto ? 'amount' : 'fiat';
const getActiveAmount = (values: TestFormValues) =>
    values.amountInCrypto ? values.amount : values.fiat;
const isFetchAllowed = (values: TestFormValues) => !!getActiveAmount(values);

const CRYPTO_DEFAULTS: TestFormValues = {
    amount: '1',
    fiat: '',
    amountInCrypto: true,
    asset: 'btc',
    fee: '1',
};

const FIAT_DEFAULTS: TestFormValues = {
    amount: '',
    fiat: '100',
    amountInCrypto: false,
    asset: 'btc',
    fee: '1',
};

const NO_REQUEST_WAIT_MS = DEBOUNCE_DELAY_MS + 200;

const wait = (ms: number) =>
    act(
        () =>
            new Promise<void>(resolve => {
                setTimeout(resolve, ms);
            }),
    );

type RenderQuoteRequestParams = {
    defaultValues: TestFormValues;
    invalidFields?: readonly TestField[];
};

const renderQuoteRequest = ({ defaultValues, invalidFields = [] }: RenderQuoteRequestParams) => {
    const root = createTestCompositionRoot({
        preloadedState: { wallet: { trading: tradingInitialState } },
    });
    const abort = jest.fn();
    const requestQuotes = jest.fn((_values: TestFormValues) => ({
        abort,
        unwrap: () => new Promise<never>(() => {}),
    }));
    const stopScheduler = jest.fn();

    const rendered = renderHookWithStoreProvider(
        () => {
            const methods = useForm<TestFormValues>({ mode: 'onChange', defaultValues });
            invalidFields.forEach(field => {
                methods.register(field, { validate: () => 'invalid' });
            });

            const { isScheduledQuotesRefresh } = useTradingQuoteRequest({
                methods,
                immediateFields: IMMEDIATE_FIELDS,
                debouncedFields: DEBOUNCED_FIELDS,
                getActiveAmountField,
                getActiveAmount,
                isFetchAllowed,
                requestQuotes,
                stopScheduler,
            });

            return { methods, isScheduledQuotesRefresh };
        },
        { root },
    );

    return { ...rendered, requestQuotes, abort, stopScheduler };
};

describe('useTradingQuoteRequest', () => {
    it('requests on mount and again after the active amount changes', async () => {
        const { result, requestQuotes } = renderQuoteRequest({ defaultValues: CRYPTO_DEFAULTS });

        await waitFor(() => expect(requestQuotes).toHaveBeenCalledTimes(1));

        act(() => {
            result.current.methods.setValue('amount', '2');
        });

        await waitFor(() => expect(requestQuotes).toHaveBeenCalledTimes(2), { timeout: 1500 });
        expect(requestQuotes).toHaveBeenLastCalledWith(expect.objectContaining({ amount: '2' }));
    });

    it('schedules one request when the inactive side is written before the flag flips', async () => {
        const { result, requestQuotes } = renderQuoteRequest({ defaultValues: FIAT_DEFAULTS });

        await waitFor(() => expect(requestQuotes).toHaveBeenCalledTimes(1));

        act(() => {
            result.current.methods.setValue('amount', '1');
            result.current.methods.setValue('amountInCrypto', true);
            result.current.methods.setValue('fiat', '');
        });

        await waitFor(() => expect(requestQuotes).toHaveBeenCalledTimes(2), { timeout: 1500 });
        await wait(NO_REQUEST_WAIT_MS);

        expect(requestQuotes).toHaveBeenCalledTimes(2);
        expect(requestQuotes).toHaveBeenLastCalledWith(
            expect.objectContaining({ amount: '1', fiat: '', amountInCrypto: true }),
        );
    });

    it('ignores a write to the derived side', async () => {
        const { result, requestQuotes, abort } = renderQuoteRequest({
            defaultValues: CRYPTO_DEFAULTS,
        });

        await waitFor(() => expect(requestQuotes).toHaveBeenCalledTimes(1));

        act(() => {
            result.current.methods.setValue('fiat', '50');
        });
        await wait(NO_REQUEST_WAIT_MS);

        expect(requestQuotes).toHaveBeenCalledTimes(1);
        expect(abort).not.toHaveBeenCalled();
        expect(result.current.isScheduledQuotesRefresh).toBe(true);
    });

    it('requests when only the amount side flips and both sides hold the same value', async () => {
        const { result, requestQuotes } = renderQuoteRequest({
            defaultValues: { ...FIAT_DEFAULTS, amount: '100' },
        });

        await waitFor(() => expect(requestQuotes).toHaveBeenCalledTimes(1));

        act(() => {
            result.current.methods.setValue('amountInCrypto', true);
        });

        await waitFor(() => expect(requestQuotes).toHaveBeenCalledTimes(2), { timeout: 1500 });
    });

    it('stops requesting when the active amount is cleared', async () => {
        const { result, requestQuotes, abort, stopScheduler } = renderQuoteRequest({
            defaultValues: CRYPTO_DEFAULTS,
        });

        await waitFor(() => expect(requestQuotes).toHaveBeenCalledTimes(1));

        act(() => {
            result.current.methods.setValue('amount', '');
        });
        await wait(NO_REQUEST_WAIT_MS);

        expect(abort).toHaveBeenCalledTimes(1);
        expect(stopScheduler).toHaveBeenCalledTimes(1);
        expect(requestQuotes).toHaveBeenCalledTimes(1);
        expect(result.current.isScheduledQuotesRefresh).toBe(false);
    });

    it('does not let an invalid field outside the active amount block the request', async () => {
        const { requestQuotes } = renderQuoteRequest({
            defaultValues: CRYPTO_DEFAULTS,
            invalidFields: ['fee'],
        });

        await waitFor(() => expect(requestQuotes).toHaveBeenCalledTimes(1));
    });

    it('does not request while the active amount is invalid', async () => {
        const { requestQuotes } = renderQuoteRequest({
            defaultValues: CRYPTO_DEFAULTS,
            invalidFields: ['amount'],
        });

        await wait(NO_REQUEST_WAIT_MS);

        expect(requestQuotes).not.toHaveBeenCalled();
    });
});
