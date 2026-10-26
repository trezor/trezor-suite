import { useCallback, useEffect, useRef, useState } from 'react';
import { useSelector } from 'react-redux';

import { isFulfilled } from '@reduxjs/toolkit';

import { invariant } from '@suite-common/suite-utils';
import {
    type AccountsRootState,
    type FeesRootState,
    selectAccountByKey,
    selectConvertedNetworkFeeInfo,
    selectIsEip1559Fee,
} from '@suite-common/wallet-core';
import type {
    Account,
    AccountKey,
    FeeInfo,
    FormState,
    GeneralPrecomposedLevels,
    PrecomposedTransaction,
} from '@suite-common/wallet-types';
import { isFinalPrecomposedTransaction } from '@suite-common/wallet-types';
import { useFormContext, useFormState, useWatch } from '@suite-native/forms';
import { useTranslate } from '@suite-native/intl';
import { type FeeLevel } from '@trezor/connect';
import { useServices } from '@trezor/dependency-injection';
import { useDebounce } from '@trezor/react-utils';
import { injectDispatch } from '@trezor/redux-utils';
import { BigNumber } from '@trezor/utils';

import { type FeesFormValues } from '../../feesFormSchema';
import {
    FEE_LIMIT_FIELD_NAME,
    FEE_PER_UNIT_FIELD_NAME,
    MAX_FEE_PER_GAS_FIELD_NAME,
    MAX_PRIORITY_FEE_PER_GAS_FIELD_NAME,
} from '../../presets';
import { calculateCustomFeeLevelThunk } from '../../thunks';
import { usePrecomposedTransactionError } from '../usePrecomposedTransactionError';

export type CustomFeeLevelBuilder = (feeLevel: FeeLevel) => PrecomposedTransaction | undefined;

type UseCustomFeeProps = {
    accountKey: AccountKey;
    formState: FormState | null | undefined;
    getCustomFeeLevel?: CustomFeeLevelBuilder;
};

export const useCustomFee = ({ accountKey, formState, getCustomFeeLevel }: UseCustomFeeProps) => {
    const debounce = useDebounce();
    const { translate } = useTranslate();
    const { dispatch } = useServices(injectDispatch);

    const [feeError, setFeeError] = useState<{ code?: string } | null>(null);
    const [isFeeLoading, setIsFeeLoading] = useState(true);

    const requestIdRef = useRef(0);
    const [preparedFee, setPreparedFee] = useState<{
        key: string;
        formState: FormState;
        account: Account | null;
        feeInfo: FeeInfo | null;
        feeLevels: GeneralPrecomposedLevels;
        builder: CustomFeeLevelBuilder | undefined;
    } | null>(null);

    const account = useSelector((state: AccountsRootState) =>
        selectAccountByKey(state, accountKey),
    );
    const networkType = account?.networkType;
    const symbol = account?.symbol;
    const feeInfo = useSelector((state: FeesRootState) =>
        selectConvertedNetworkFeeInfo(state, symbol),
    );

    const isEip1559Fee = useSelector((state: FeesRootState) =>
        selectIsEip1559Fee(state, symbol ?? undefined),
    );

    const { trigger, control, setError } = useFormContext<FeesFormValues>();
    const { isValid } = useFormState({ control });

    const customFeePerUnit = useWatch({
        control,
        name: FEE_PER_UNIT_FIELD_NAME,
    });
    const customFeeLimit = useWatch({
        control,
        name: FEE_LIMIT_FIELD_NAME,
    }) as string;
    const customMaxFeePerGas = useWatch({
        control,
        name: MAX_FEE_PER_GAS_FIELD_NAME,
    });
    const customMaxPriorityFeePerGas = useWatch({
        control,
        name: MAX_PRIORITY_FEE_PER_GAS_FIELD_NAME,
    });

    const inputKey = JSON.stringify([
        accountKey,
        customFeePerUnit,
        customFeeLimit,
        customMaxFeePerGas,
        customMaxPriorityFeePerGas,
    ]);
    const handleValuesChange = useCallback(
        async (requestId: number) => {
            const areValuesValid = await trigger();
            if (requestId !== requestIdRef.current) return;

            invariant(networkType !== 'solana', 'Custom fee is not supported for solana');

            const feePerUnit = isEip1559Fee ? customMaxFeePerGas : customFeePerUnit;
            if (!areValuesValid || !feePerUnit || !formState) {
                setIsFeeLoading(false);

                return;
            }

            setIsFeeLoading(true);
            setFeeError(null);

            let feeLevels: GeneralPrecomposedLevels | undefined;
            if (getCustomFeeLevel) {
                try {
                    const custom = getCustomFeeLevel({
                        label: 'custom',
                        blocks: -1,
                        feePerUnit,
                        feeLimit: customFeeLimit,
                        ...(isEip1559Fee
                            ? {
                                  maxPriorityFeePerGas: customMaxPriorityFeePerGas,
                                  maxFeePerGas: customMaxFeePerGas,
                              }
                            : {}),
                    });
                    feeLevels = custom ? { custom } : undefined;
                } catch {
                    feeLevels = undefined;
                }
            } else {
                const response = await dispatch(
                    calculateCustomFeeLevelThunk({
                        accountKey,
                        formState,
                        selectedFeeLevel: 'custom',
                        customFeePerUnit,
                        customFeeLimit,
                        customMaxPriorityFeePerGas,
                        customMaxFeePerGas,
                    }),
                );
                feeLevels = isFulfilled(response) ? response.payload : undefined;
            }
            if (requestId !== requestIdRef.current) return;

            const custom = feeLevels?.custom;
            if (!isFinalPrecomposedTransaction(custom)) {
                setFeeError({ code: custom?.type === 'error' ? custom.error : undefined });
            } else if (
                networkType === 'ethereum' &&
                custom.estimatedFeeLimit &&
                new BigNumber(customFeeLimit).lt(custom.estimatedFeeLimit)
            ) {
                setError('customFeeLimit', {
                    type: 'validate',
                    message: translate(
                        'transactionManagement.fees.custom.bottomSheet.errors.feeLimit.low',
                        {
                            minGasLimit: custom.estimatedFeeLimit,
                        },
                    ),
                });
            } else if (feeLevels) {
                setPreparedFee({
                    key: inputKey,
                    formState,
                    account,
                    feeInfo,
                    feeLevels,
                    builder: getCustomFeeLevel,
                });
            }
            if (requestId === requestIdRef.current) setIsFeeLoading(false);
        },
        [
            trigger,
            setError,
            translate,
            inputKey,
            getCustomFeeLevel,
            account,
            feeInfo,
            networkType,
            isEip1559Fee,
            customFeePerUnit,
            formState,
            dispatch,
            accountKey,
            customFeeLimit,
            customMaxPriorityFeePerGas,
            customMaxFeePerGas,
        ],
    );

    useEffect(() => {
        const requestId = ++requestIdRef.current;
        setPreparedFee(null);
        setIsFeeLoading(true);
        setFeeError(null);
        debounce(() => handleValuesChange(requestId));

        return () => {
            requestIdRef.current += 1;
        };
    }, [handleValuesChange, debounce]);

    const currentFeeLevels =
        preparedFee?.key === inputKey &&
        preparedFee.formState === formState &&
        preparedFee.account === account &&
        preparedFee.feeInfo === feeInfo &&
        preparedFee.builder === getCustomFeeLevel
            ? preparedFee.feeLevels
            : undefined;
    const customFeeLevel = currentFeeLevels?.custom;
    const feeValue = isFinalPrecomposedTransaction(customFeeLevel) ? customFeeLevel.fee : null;

    const precomposedError = usePrecomposedTransactionError({
        error: feeError?.code,
        networkSymbol: symbol,
    });
    const errorMessage = feeError
        ? (precomposedError ?? translate('moduleSend.fees.unavailable'))
        : null;

    const isSubmittable = isFinalPrecomposedTransaction(customFeeLevel) && !isFeeLoading && isValid;

    return {
        feeValue,
        isFeeLoading,
        errorMessage,
        isSubmittable,
        feeLevels: currentFeeLevels,
    };
};
