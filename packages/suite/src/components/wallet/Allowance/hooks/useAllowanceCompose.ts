import { useEffect, useMemo } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { useSelector } from 'react-redux';

import { isFulfilled } from '@reduxjs/toolkit';

import { commonQueryKeys, useQuery } from '@suite-common/react-query';
import { DEFAULT_PAYMENT, DEFAULT_VALUES } from '@suite-common/wallet-constants';
import {
    type FeesRootState,
    composeAllowanceTransactionThunk,
    selectRawNetworkFeeInfo,
} from '@suite-common/wallet-core';
import { type Account, type FeeLevelLabel, type FormState } from '@suite-common/wallet-types';
import {
    buildApprovalTransactionData,
    getConvertedOrDefaultFeeInfo,
} from '@suite-common/wallet-utils';
import { type TokenInfo } from '@trezor/blockchain-link-types';
import { useServices } from '@trezor/dependency-injection';
import { injectDispatch } from '@trezor/redux-utils';
import { resolveAfter } from '@trezor/utils';

import { useFees } from '#src/hooks/wallet/form/useFees';

// Typing a custom fee would otherwise compose on every keystroke.
const CUSTOM_FEE_DEBOUNCE_MS = 300;

type UseAllowanceComposeParams = {
    account: Account;
    contract: string;
    spender: string;
    amount: string;
    token?: TokenInfo;
};

export const useAllowanceCompose = ({
    account,
    contract,
    spender,
    amount,
    token,
}: UseAllowanceComposeParams) => {
    const { dispatch } = useServices(injectDispatch);

    const { networkType, symbol } = account;

    const rawFeeInfo = useSelector((state: FeesRootState) =>
        selectRawNetworkFeeInfo(state, symbol),
    );
    const feeInfo = useMemo(
        () => getConvertedOrDefaultFeeInfo({ networkType, feeInfo: rawFeeInfo }),
        [networkType, rawFeeInfo],
    );

    const methods = useForm<FormState>({
        mode: 'onChange',
        defaultValues: {
            ...DEFAULT_VALUES,
            outputs: [],
            options: ['broadcast'],
        },
    });
    const { control, setValue } = methods;

    const [watchedFee, feePerUnit, feeLimit, maxFeePerGas, maxPriorityFeePerGas] = useWatch({
        control,
        name: ['selectedFee', 'feePerUnit', 'feeLimit', 'maxFeePerGas', 'maxPriorityFeePerGas'],
    });

    const data = useMemo(
        () => buildApprovalTransactionData({ amount, spender }),
        [amount, spender],
    );

    // Preset fee levels are all composed at once, so only a custom fee is part of the request.
    const customFee = useMemo(
        () =>
            watchedFee === 'custom'
                ? {
                      feePerUnit: feePerUnit ?? '',
                      feeLimit: feeLimit ?? '',
                      maxFeePerGas,
                      maxPriorityFeePerGas,
                  }
                : undefined,
        [watchedFee, feePerUnit, feeLimit, maxFeePerGas, maxPriorityFeePerGas],
    );

    const { data: composedLevels, isFetching: isComposing } = useQuery({
        queryKey: commonQueryKeys.allowanceCompose({ account, feeInfo, contract, data, customFee }),
        queryFn: async ({ signal }) => {
            if (customFee) {
                await resolveAfter(CUSTOM_FEE_DEBOUNCE_MS, signal);
            }

            const result = await dispatch(
                composeAllowanceTransactionThunk({
                    feeInfo,
                    account,
                    contract,
                    data,
                    selectedFee: customFee ? 'custom' : 'normal',
                    customFee,
                }),
            );

            return isFulfilled(result) ? result.payload : null;
        },
        staleTime: Infinity,
        gcTime: 0,
        retry: false,
    });

    // Keep `formState` as its own binding: the spread object is a react-hook-form ref that
    // never changes identity, so without it the React Compiler caches this argument once and
    // `useFees` reads validation errors frozen at their first-render value.
    const { formState } = methods;

    const { changeFeeLevel, selectedFee: formSelectedFee } = useFees({
        ...methods,
        formState,
        defaultValue: 'normal',
        feeInfo,
        composedLevels: composedLevels ?? undefined,
    });
    const selectedFee = formSelectedFee ?? ('normal' satisfies FeeLevelLabel);

    const selectedLevel = composedLevels?.[selectedFee];
    const composedTransaction = selectedLevel?.type === 'final' ? selectedLevel : undefined;
    const estimatedFeeLimit = composedTransaction?.estimatedFeeLimit;

    // The fee inputs read the transaction data, the output and the estimated limit from the form.
    useEffect(() => {
        setValue('transactionData', data, { shouldDirty: true });
    }, [data, setValue]);

    useEffect(() => {
        setValue(
            'outputs',
            [
                {
                    ...DEFAULT_PAYMENT,
                    address: contract,
                    amount: '0',
                    token: token?.contract ?? null,
                },
            ],
            { shouldDirty: true },
        );
    }, [contract, token?.contract, setValue]);

    useEffect(() => {
        if (estimatedFeeLimit) {
            setValue('estimatedFeeLimit', estimatedFeeLimit, { shouldDirty: true });
        }
    }, [estimatedFeeLimit, setValue]);

    return {
        data,
        feeInfo,
        isComposing,
        composedLevels: composedLevels ?? undefined,
        composedTransaction,
        selectedFee,
        methods,
        changeFeeLevel,
    };
};
