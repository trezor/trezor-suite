import { useEffect, useRef } from 'react';
import { type UseFormGetValues, type UseFormTrigger } from 'react-hook-form';

import { CRYPTO_INPUT, FIAT_INPUT, OUTPUT_AMOUNT } from 'src/types/earn/earnFormFields';

import { type WithdrawalFormState } from '../../components/earn/forms/StakeFormContext';

type UseRevalidateAmountOnBalanceChangeParams = {
    stakedBalance: string;
    getValues: UseFormGetValues<WithdrawalFormState>;
    trigger: UseFormTrigger<WithdrawalFormState>;
    composeRequest: (field: typeof CRYPTO_INPUT) => Promise<void>;
};

export const useRevalidateAmountOnBalanceChange = ({
    stakedBalance,
    getValues,
    trigger,
    composeRequest,
}: UseRevalidateAmountOnBalanceChangeParams) => {
    const previousStakedBalanceRef = useRef<string | null>(null);

    useEffect(() => {
        const previousStakedBalance = previousStakedBalanceRef.current;
        previousStakedBalanceRef.current = stakedBalance;

        if (previousStakedBalance === stakedBalance || !getValues(OUTPUT_AMOUNT)) return;

        const hasStakedBalanceChanged = previousStakedBalance !== null;

        const revalidateAmount = async () => {
            // Only the active amount input is mounted; triggering both validates it and skips the other.
            const isAmountValid = await trigger([OUTPUT_AMOUNT, FIAT_INPUT]);

            if (isAmountValid && hasStakedBalanceChanged) {
                await composeRequest(CRYPTO_INPUT);
            }
        };

        revalidateAmount();
    }, [stakedBalance, getValues, trigger, composeRequest]);
};
