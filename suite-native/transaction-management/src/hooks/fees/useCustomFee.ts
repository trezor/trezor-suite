import { useCallback, useEffect, useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';

import { isRejected } from '@reduxjs/toolkit';

import { invariant } from '@suite-common/suite-utils';
import {
    type AccountsRootState,
    type FeesRootState,
    selectAccountNetworkSymbol,
    selectAccountNetworkType,
    selectIsEip1559Fee,
} from '@suite-common/wallet-core';
import {
    type AccountKey,
    type FormState,
    isFinalPrecomposedTransaction,
} from '@suite-common/wallet-types';
import { useFormContext } from '@suite-native/forms';
import { useTranslate } from '@suite-native/intl';
import { useDebounce } from '@trezor/react-utils';
import { BigNumber, isNotNullOrUndefined } from '@trezor/utils';

import { type FeesFormValues } from '../../feesFormSchema';
import {
    FEE_LIMIT_FIELD_NAME,
    FEE_PER_UNIT_FIELD_NAME,
    MAX_FEE_PER_GAS_FIELD_NAME,
    MAX_PRIORITY_FEE_PER_GAS_FIELD_NAME,
} from '../../presets';
import { selectCustomFeeLevel, selectFeeLevelTransactionBytes } from '../../selectors';
import { type NativeSendRootState } from '../../sendFormSlice';
import { calculateCustomFeeLevelThunk } from '../../thunks';

type UseCustomFeeProps = {
    accountKey: AccountKey;
    formState: FormState | null | undefined;
};

export const useCustomFee = ({ accountKey, formState }: UseCustomFeeProps) => {
    const debounce = useDebounce();
    const { translate } = useTranslate();
    const dispatch = useDispatch();

    const [isErrorBoxVisible, setIsErrorBoxVisible] = useState(false);
    const [isFeeLoading, setIsFeeLoading] = useState(false);

    const customFeeLevel = useSelector(selectCustomFeeLevel);

    const networkType = useSelector((state: AccountsRootState) =>
        selectAccountNetworkType(state, accountKey),
    );

    const symbol = useSelector((state: AccountsRootState) =>
        selectAccountNetworkSymbol(state, accountKey),
    );

    const isEip1559Fee = useSelector((state: FeesRootState) =>
        selectIsEip1559Fee(state, symbol ?? undefined),
    );

    const {
        formState: { errors },
        setError,
        trigger,
        getValues,
        watch,
    } = useFormContext<FeesFormValues>();

    const { customFeePerUnit, customFeeLimit, customMaxFeePerGas, customMaxPriorityFeePerGas } =
        getValues();

    const watchedFeePerUnit = watch(FEE_PER_UNIT_FIELD_NAME, '0');
    const watchedFeeLimit = watch(FEE_LIMIT_FIELD_NAME, '1') as string;
    const watchedMaxFeePerGas = watch(MAX_FEE_PER_GAS_FIELD_NAME, '0');
    const watchedMaxPriorityFeePerGas = watch(MAX_PRIORITY_FEE_PER_GAS_FIELD_NAME, '0');

    const normalLevelTransactionBytes = useSelector((state: NativeSendRootState) =>
        selectFeeLevelTransactionBytes(state, 'normal'),
    );

    const handleValuesChange = useCallback(async () => {
        trigger();

        invariant(networkType !== 'solana', 'Custom fee is not supported for solana');

        if ((!isEip1559Fee && !customFeePerUnit) || !formState) {
            console.warn('Cannot calculate custom fee because of missing values');
            setIsFeeLoading(false);

            return;
        }

        setIsFeeLoading(true);
        setIsErrorBoxVisible(false);

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

        if (isRejected(response)) {
            if (networkType === 'ethereum') {
                setIsErrorBoxVisible(true);
            } else {
                setError(FEE_PER_UNIT_FIELD_NAME, {
                    message: translate('moduleSend.fees.error'),
                });
            }
        }

        setIsFeeLoading(false);
    }, [
        trigger,
        networkType,
        isEip1559Fee,
        customFeePerUnit,
        formState,
        dispatch,
        accountKey,
        customFeeLimit,
        customMaxPriorityFeePerGas,
        customMaxFeePerGas,
        setError,
        translate,
    ]);

    useEffect(() => {
        setIsFeeLoading(true);
        debounce(handleValuesChange);
    }, [
        watchedFeePerUnit,
        watchedFeeLimit,
        handleValuesChange,
        debounce,
        networkType,
        watchedMaxFeePerGas,
        watchedMaxPriorityFeePerGas,
    ]);

    // If the trezor-connect is unable to compose the transaction, we display rough estimate of the fee instead.
    const feeEstimate = useMemo(
        () =>
            watchedFeePerUnit
                ? BigNumber(watchedFeePerUnit)
                      .times(watchedFeeLimit)
                      .times(normalLevelTransactionBytes)
                      .toString()
                : '0',
        [watchedFeePerUnit, watchedFeeLimit, normalLevelTransactionBytes],
    );
    const feeValue = isFinalPrecomposedTransaction(customFeeLevel)
        ? customFeeLevel.fee
        : feeEstimate;

    const hasFeePerByteError = isNotNullOrUndefined(errors[FEE_PER_UNIT_FIELD_NAME]);
    const isSubmittable =
        isNotNullOrUndefined(customFeeLevel) && !hasFeePerByteError && !isErrorBoxVisible;

    return { feeValue, isFeeLoading, isErrorBoxVisible, isSubmittable };
};
