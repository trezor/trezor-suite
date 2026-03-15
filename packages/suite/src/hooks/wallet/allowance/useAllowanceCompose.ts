import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useForm } from 'react-hook-form';

import { isFulfilled } from '@reduxjs/toolkit';
import { useMutation } from '@tanstack/react-query';

import { DEFAULT_PAYMENT, DEFAULT_VALUES } from '@suite-common/wallet-constants';
import {
    type ComposeAllowanceTransactionThunkParams,
    composeAllowanceTransactionThunk,
    selectRawNetworkFeeInfo,
} from '@suite-common/wallet-core';
import {
    type Account,
    type FeeLevelLabel,
    type FormState,
    type PrecomposedLevels,
} from '@suite-common/wallet-types';
import {
    buildApprovalTransactionData,
    getConvertedOrDefaultFeeInfo,
} from '@suite-common/wallet-utils';
import { type TokenInfo } from '@trezor/blockchain-link-types';
import { useCurrentRef, useDebounce } from '@trezor/react-utils';

import { useDispatch, useSelector } from 'src/hooks/suite';
import { useFees } from 'src/hooks/wallet/form/useFees';

interface UseAllowanceComposeParams {
    account: Account;
    contract: string;
    spender: string;
    amount: string;
    token?: TokenInfo;
    defaultFeeLevel?: FeeLevelLabel;
}

export const useAllowanceCompose = ({
    account,
    contract,
    spender,
    amount,
    token,
    defaultFeeLevel = 'normal',
}: UseAllowanceComposeParams) => {
    const dispatch = useDispatch();
    const debounce = useDebounce();

    const { networkType, symbol } = account;

    const rawFeeInfo = useSelector(state => selectRawNetworkFeeInfo(state, symbol));
    const feeInfo = useMemo(
        () => getConvertedOrDefaultFeeInfo({ networkType, feeInfo: rawFeeInfo }),
        [networkType, rawFeeInfo],
    );
    const resolvedDefaultFeeLevel = useMemo<FeeLevelLabel>(
        () =>
            feeInfo.levels.some(level => level.label === defaultFeeLevel)
                ? defaultFeeLevel
                : 'normal',
        [defaultFeeLevel, feeInfo.levels],
    );

    const methods = useForm<FormState>({
        mode: 'onChange',
        defaultValues: {
            ...DEFAULT_VALUES,
            selectedFee: resolvedDefaultFeeLevel,
            outputs: [],
            options: ['broadcast'],
        },
    });

    const [composedLevels, setComposedLevels] = useState<PrecomposedLevels | undefined>(undefined);
    const composeRequestIdRef = useRef(0);
    const prevFeeInfoBlockHeightRef = useRef<number | null>(null);
    const methodsRef = useCurrentRef(methods);

    const data = useMemo(
        () => buildApprovalTransactionData({ amount, spender }),
        [amount, spender],
    );

    const { mutate, isPending: isComposing } = useMutation({
        mutationFn: async () => {
            composeRequestIdRef.current += 1;
            const currentRequestId = composeRequestIdRef.current;

            const formValues = methods.getValues();
            const feeLevel = (formValues.selectedFee ??
                resolvedDefaultFeeLevel) satisfies FeeLevelLabel;

            const customFee =
                feeLevel === 'custom'
                    ? {
                          feePerUnit: formValues.feePerUnit ?? '',
                          feeLimit: formValues.feeLimit ?? '',
                          maxFeePerGas: formValues.maxFeePerGas,
                          maxPriorityFeePerGas: formValues.maxPriorityFeePerGas,
                      }
                    : undefined;

            const thunkParams: ComposeAllowanceTransactionThunkParams = {
                feeInfo,
                account,
                contract,
                data,
                selectedFee: feeLevel,
                customFee,
            };

            const result = await debounce(() =>
                dispatch(composeAllowanceTransactionThunk(thunkParams)).then(res =>
                    isFulfilled(res) ? res.payload : undefined,
                ),
            );

            if (currentRequestId !== composeRequestIdRef.current) {
                return null;
            }

            return result ? { levels: result as PrecomposedLevels, feeLevel } : null;
        },
        onMutate: () => {
            setComposedLevels(undefined);
        },
        onSuccess: result => {
            if (!result) return;

            const { levels, feeLevel } = result;
            setComposedLevels(levels);

            const selected = levels[feeLevel];
            if (selected?.type === 'final' && selected.estimatedFeeLimit) {
                methods.setValue('estimatedFeeLimit', selected.estimatedFeeLimit, {
                    shouldDirty: true,
                });
            }
        },
    });

    const composeRequest = useCallback(
        (_field?: string) => {
            mutate();
        },
        [mutate],
    );
    const composeRequestRef = useCurrentRef(composeRequest);

    const onFeeLevelChange = useCallback(
        (prev?: string, current?: string) => {
            if (!current || !composedLevels) return;

            if (current === 'custom') {
                const prevLevel = composedLevels[prev || 'normal'];
                setComposedLevels({
                    ...composedLevels,
                    custom: prevLevel,
                });
            }
        },
        [composedLevels],
    );

    const { changeFeeLevel, selectedFee: formSelectedFee } = useFees({
        ...methods,
        defaultValue: resolvedDefaultFeeLevel,
        feeInfo,
        onChange: onFeeLevelChange,
        composeRequest,
        composedLevels,
    });
    const selectedFee = formSelectedFee ?? resolvedDefaultFeeLevel;

    useEffect(() => {
        const selectedFee = methods.getValues('selectedFee');

        if (!selectedFee) {
            methods.setValue('selectedFee', resolvedDefaultFeeLevel, { shouldDirty: false });

            return;
        }

        const shouldPromoteToPreferredFeeLevel =
            defaultFeeLevel !== 'normal' &&
            resolvedDefaultFeeLevel === defaultFeeLevel &&
            selectedFee === 'normal';

        if (shouldPromoteToPreferredFeeLevel) {
            methods.setValue('selectedFee', defaultFeeLevel, { shouldDirty: false });
            composeRequestRef.current();
        }
    }, [methods, defaultFeeLevel, resolvedDefaultFeeLevel, composeRequestRef]);

    const composedTransaction = useMemo(() => {
        if (!composedLevels) return undefined;

        const selected = composedLevels[selectedFee];

        return selected?.type === 'final' ? selected : undefined;
    }, [composedLevels, selectedFee]);

    useEffect(() => {
        methodsRef.current.setValue('transactionData', data, { shouldDirty: true });
    }, [data, methodsRef]);

    useEffect(() => {
        methodsRef.current.setValue(
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
    }, [contract, token?.contract, methodsRef]);

    useEffect(() => {
        if (prevFeeInfoBlockHeightRef.current === null) {
            prevFeeInfoBlockHeightRef.current = feeInfo.blockHeight;

            return;
        }

        if (feeInfo.blockHeight > prevFeeInfoBlockHeightRef.current && composedLevels) {
            prevFeeInfoBlockHeightRef.current = feeInfo.blockHeight;

            composeRequestRef.current();
        }
    }, [composedLevels, feeInfo.blockHeight, composeRequestRef]);

    return {
        data,
        feeInfo,
        isComposing,
        composedLevels,
        composedTransaction,
        selectedFee,
        composeRequest,
        methods,
        changeFeeLevel,
    };
};
