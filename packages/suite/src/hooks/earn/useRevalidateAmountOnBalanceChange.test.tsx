import { useForm } from 'react-hook-form';

import { act, renderHook, waitFor } from '@testing-library/react';

import { CRYPTO_INPUT, FIAT_INPUT, OUTPUT_AMOUNT } from '#src/types/earn/earnFormFields';

import { useRevalidateAmountOnBalanceChange } from './useRevalidateAmountOnBalanceChange';
import { type WithdrawalFormState } from '../../components/earn/forms/StakeFormContext';

const AMOUNT_ABOVE_BALANCE = 'Amount above the staked balance';
const FIAT_RATE = 2;

type ActiveInput = 'crypto' | 'fiat';

type RenderParams = {
    amount?: string;
    stakedBalance: string;
    activeInput: ActiveInput;
};

const toFiat = (amount?: string) => (amount ? String(Number(amount) * FIAT_RATE) : undefined);

// Mirrors UnstakeInputs: the amount rules sit on the mounted input only, never on cryptoInput.
const renderRevalidation = ({ amount, stakedBalance, activeInput }: RenderParams) => {
    const composeRequest = jest.fn((_field?: string) => Promise.resolve());

    const rendered = renderHook(
        ({ stakedBalance: currentStakedBalance }: Pick<RenderParams, 'stakedBalance'>) => {
            const methods = useForm<WithdrawalFormState>({
                mode: 'onChange',
                defaultValues: {
                    outputs: [{ amount }],
                    cryptoInput: amount,
                    fiatInput: toFiat(amount),
                },
            });

            const isWithinBalance = (cryptoAmount: string) =>
                Number(cryptoAmount) <= Number(currentStakedBalance) || AMOUNT_ABOVE_BALANCE;

            if (activeInput === 'crypto') {
                methods.register(OUTPUT_AMOUNT, {
                    validate: value => !value || isWithinBalance(value),
                });
            } else {
                methods.register(FIAT_INPUT, {
                    validate: value => !value || isWithinBalance(String(Number(value) / FIAT_RATE)),
                });
            }

            useRevalidateAmountOnBalanceChange({
                stakedBalance: currentStakedBalance,
                getValues: methods.getValues,
                trigger: methods.trigger,
                composeRequest,
            });

            return methods;
        },
        { initialProps: { stakedBalance } },
    );

    const activeField = activeInput === 'crypto' ? OUTPUT_AMOUNT : FIAT_INPUT;
    const getAmountError = () => rendered.result.current.getFieldState(activeField).error?.message;

    return { ...rendered, composeRequest, getAmountError };
};

describe('useRevalidateAmountOnBalanceChange', () => {
    describe.each<ActiveInput>(['crypto', 'fiat'])('with the %s input active', activeInput => {
        it('flags a restored amount above the staked balance without composing it', async () => {
            const { composeRequest, getAmountError } = renderRevalidation({
                amount: '5',
                stakedBalance: '3',
                activeInput,
            });

            await waitFor(() => expect(getAmountError()).toBe(AMOUNT_ABOVE_BALANCE));
            expect(composeRequest).not.toHaveBeenCalled();
        });

        it('leaves a valid restored amount to the initial compose', async () => {
            const { composeRequest, getAmountError } = renderRevalidation({
                amount: '2',
                stakedBalance: '3',
                activeInput,
            });

            await act(() => Promise.resolve());

            expect(getAmountError()).toBeUndefined();
            expect(composeRequest).not.toHaveBeenCalled();
        });

        it('does not validate an empty amount', async () => {
            const { getAmountError, result } = renderRevalidation({
                stakedBalance: '3',
                activeInput,
            });

            await act(() => Promise.resolve());

            expect(getAmountError()).toBeUndefined();
            expect(result.current.formState.errors).toEqual({});
        });

        it('recomposes a still valid amount after the staked balance changes', async () => {
            const { composeRequest, getAmountError, rerender } = renderRevalidation({
                amount: '2',
                stakedBalance: '3',
                activeInput,
            });
            await act(() => Promise.resolve());

            rerender({ stakedBalance: '2.5' });

            await waitFor(() => expect(composeRequest).toHaveBeenCalledWith(CRYPTO_INPUT));
            expect(getAmountError()).toBeUndefined();
        });

        it('flags an amount above the changed staked balance without composing it', async () => {
            const { composeRequest, getAmountError, rerender } = renderRevalidation({
                amount: '2',
                stakedBalance: '3',
                activeInput,
            });
            await act(() => Promise.resolve());

            rerender({ stakedBalance: '1' });

            await waitFor(() => expect(getAmountError()).toBe(AMOUNT_ABOVE_BALANCE));
            expect(composeRequest).not.toHaveBeenCalled();
        });
    });
});
