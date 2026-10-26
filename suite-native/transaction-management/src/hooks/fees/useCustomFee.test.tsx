import { type PropsWithChildren } from 'react';

import { asNetworkSymbol } from '@suite-common/wallet-config';
import { type FormState } from '@suite-common/wallet-types';
import { Form, useForm } from '@suite-native/forms';
import { getTranslation, useTranslate } from '@suite-native/intl';
import { act, renderHookWithStoreProvider } from '@suite-native/test-utils-store';
import { createDeferred } from '@trezor/utils';

import { useCustomFee } from './useCustomFee';
import { createFeeLevel } from '../../__fixtures__/feeLevels';
import { ETH_ACCOUNT_KEY, getWalletState } from '../../__fixtures__/walletState';
import {
    type FeesFormContext,
    type FeesFormValues,
    feesFormValidationSchema,
} from '../../feesFormSchema';
import { calculateCustomFeeLevelThunk } from '../../thunks';

const mockCompose = jest.fn();
jest.mock('../../thunks', () => ({
    ...jest.requireActual('../../thunks'),
    calculateCustomFeeLevelThunk: jest.fn(params => () => mockCompose(params)),
}));

const FORM_STATE: FormState = {
    outputs: [],
    selectedFee: 'normal',
    feePerUnit: '10',
    feeLimit: '21000',
    options: [],
    selectedUtxos: [],
    isCoinControlEnabled: false,
    hasCoinControlBeenOpened: false,
};
const success = (fee: string) => ({
    type: 'test/fulfilled',
    meta: { requestStatus: 'fulfilled', requestId: fee },
    payload: { custom: createFeeLevel({ fee }) },
});
const settle = () => act(() => jest.advanceTimersByTimeAsync(300));

const renderCustom = async () => {
    const { result: form } = await renderHookWithStoreProvider(() => {
        const { translate } = useTranslate();

        return useForm<FeesFormValues>({
            validation: feesFormValidationSchema,
            context: {
                symbol: asNetworkSymbol('eth'),
                isEip1559Fee: false,
                networkFeeInfo: {
                    minFee: 1,
                    maxFee: 100,
                    minPriorityFee: 0,
                    blockHeight: 0,
                    blockTime: 12,
                    levels: [],
                },
                translate,
            } satisfies FeesFormContext,
            defaultValues: {
                feeLevel: 'custom',
                customFeePerUnit: '10',
                customFeeLimit: '21000',
                customMaxFeePerGas: '20',
                customMaxPriorityFeePerGas: '2',
            },
        });
    });
    const hook = await renderHookWithStoreProvider(
        () => useCustomFee({ accountKey: ETH_ACCOUNT_KEY, formState: FORM_STATE }),
        {
            preloadedState: { wallet: getWalletState() },
            wrapper: ({ children }: PropsWithChildren) => (
                <Form form={form.current}>{children}</Form>
            ),
        },
    );

    return { ...hook, form };
};

describe('custom fee preview', () => {
    beforeEach(() => {
        jest.useFakeTimers();
        mockCompose.mockResolvedValue(success('100'));
    });
    afterEach(() => {
        jest.clearAllMocks();
        jest.useRealTimers();
    });

    it.each(['', '0', '1.5', 'NaN'])(
        'does not compose an invalid gas limit %s without a standard estimate',
        async gasLimit => {
            const { result, form } = await renderCustom();
            await act(() => form.current.setValue('customFeeLimit', gasLimit));
            await settle();
            expect(mockCompose).not.toHaveBeenCalled();
            expect(result.current.isSubmittable).toBe(false);
        },
    );

    it('uses current gas values and blocks confirmation while the replacement estimate is pending', async () => {
        const { result, form } = await renderCustom();
        await settle();
        expect(result.current.isSubmittable).toBe(true);
        const pending = createDeferred<ReturnType<typeof success>>();
        mockCompose.mockReturnValueOnce(pending.promise);
        await act(() => {
            form.current.setValue('customFeePerUnit', '15');
            form.current.setValue('customFeeLimit', '30000');
            form.current.setValue('customMaxFeePerGas', '30');
            form.current.setValue('customMaxPriorityFeePerGas', '3');
        });
        expect(result.current.isSubmittable).toBe(false);
        expect(result.current.feeValue).toBeNull();
        await settle();
        expect(calculateCustomFeeLevelThunk).toHaveBeenLastCalledWith(
            expect.objectContaining({
                customFeePerUnit: '15',
                customFeeLimit: '30000',
                customMaxFeePerGas: '30',
                customMaxPriorityFeePerGas: '3',
            }),
        );
        expect(result.current.isSubmittable).toBe(false);
        expect(result.current.feeValue).toBeNull();
        await act(() => pending.resolve(success('200')));
        expect(result.current.feeValue).toBe('200');
        expect(result.current.isSubmittable).toBe(true);
    });

    it('explains a rejected estimate without inventing an insufficient balance', async () => {
        mockCompose.mockResolvedValueOnce({
            type: 'test/rejected',
            meta: { requestStatus: 'rejected', requestId: 'unavailable' },
        });
        const { result } = await renderCustom();
        await settle();
        expect(result.current.isFeeLoading).toBe(false);
        expect(result.current.errorMessage).toBe(getTranslation('moduleSend.fees.unavailable'));
        expect(result.current.isSubmittable).toBe(false);
        expect(result.current.feeValue).toBeNull();
    });

    it('validates the actual gas estimate before confirming Custom without a standard reference', async () => {
        mockCompose.mockResolvedValueOnce({
            ...success('100'),
            payload: { custom: createFeeLevel({ fee: '100', estimatedFeeLimit: '45000' }) },
        });
        const { result, form } = await renderCustom();
        await settle();
        expect(result.current.isSubmittable).toBe(false);
        expect(form.current.getFieldState('customFeeLimit').error?.message).toContain('45000');
        await act(() => form.current.setValue('customFeeLimit', '45000'));
        await settle();
        expect(result.current.isSubmittable).toBe(true);
    });

    it('does not invent a price for a failed custom transaction', async () => {
        mockCompose.mockResolvedValueOnce({
            type: 'test/fulfilled',
            meta: { requestStatus: 'fulfilled', requestId: 'failed' },
            payload: { custom: { type: 'error', error: 'AMOUNT_NOT_ENOUGH_CURRENCY_FEE' } },
        });
        const { result } = await renderCustom();
        await settle();
        expect(result.current.feeValue).toBeNull();
        expect(result.current.isSubmittable).toBe(false);
    });

    it.each([undefined, '', '0', '-1', '1.5', 'NaN', 'Infinity'])(
        'does not confirm Ethereum Custom without a usable fresh gas estimate (%s)',
        async estimatedFeeLimit => {
            mockCompose.mockResolvedValueOnce({
                ...success('100'),
                payload: { custom: createFeeLevel({ estimatedFeeLimit }) },
            });
            const { result } = await renderCustom();
            await settle();
            expect(result.current.isSubmittable).toBe(false);
            expect(result.current.feeValue).toBeNull();
            expect(result.current.errorMessage).toBe(getTranslation('moduleSend.fees.unavailable'));
        },
    );

    it('ignores a late response from the previous edit', async () => {
        const first = createDeferred<ReturnType<typeof success>>();
        mockCompose.mockReturnValueOnce(first.promise);
        const { result, form } = await renderCustom();
        await settle();
        await act(() => form.current.setValue('customFeePerUnit', '15'));
        mockCompose.mockResolvedValueOnce(success('200'));
        await settle();
        await act(() => first.resolve(success('100')));
        expect(result.current.feeValue).toBe('200');
    });

    it('does not allow confirmation of an error transaction or stale successful estimate', async () => {
        const { result, form } = await renderCustom();
        await settle();
        mockCompose.mockResolvedValueOnce({
            type: 'test/rejected',
            meta: { requestStatus: 'rejected', requestId: 'failed' },
        });
        await act(() => form.current.setValue('customFeePerUnit', '16'));
        await settle();
        expect(result.current.isSubmittable).toBe(false);
        expect(result.current.feeValue).toBeNull();
        expect(result.current.errorMessage).toBeTruthy();
    });
});
