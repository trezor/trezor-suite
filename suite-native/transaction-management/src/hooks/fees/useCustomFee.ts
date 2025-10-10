import { useCallback, useEffect, useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';

import { G } from '@mobily/ts-belt';
import { isRejected } from '@reduxjs/toolkit';

import { AccountsRootState, selectAccountNetworkType } from '@suite-common/wallet-core';
import { AccountKey, FormState, isFinalPrecomposedTransaction } from '@suite-common/wallet-types';
import { useFormContext } from '@suite-native/forms';
import { useTranslate } from '@suite-native/intl';
import { useDebounce } from '@trezor/react-utils';
import { BigNumber } from '@trezor/utils';

import { FeesFormValues } from '../../feesFormSchema';
import { selectCustomFeeLevel, selectFeeLevelTransactionBytes } from '../../selectors';
import { NativeSendRootState } from '../../sendFormSlice';
import { calculateCustomFeeLevelThunk } from '../../thunks';

type UseCustomFeeProps = {
    accountKey: AccountKey;
    formState: FormState | null | undefined;
};

const FEE_PER_UNIT_FIELD_NAME = 'customFeePerUnit';
const FEE_LIMIT_FIELD_NAME = 'customFeeLimit';

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

    const {
        formState: { errors },
        setError,
        trigger,
        getValues,
        watch,
    } = useFormContext<FeesFormValues>();

    const { customFeePerUnit, customFeeLimit } = getValues();

    const watchedFeePerUnit = watch(FEE_PER_UNIT_FIELD_NAME, '0');
    const watchedFeeLimit = watch(FEE_LIMIT_FIELD_NAME, '1') as string;

    const normalLevelTransactionBytes = useSelector((state: NativeSendRootState) =>
        selectFeeLevelTransactionBytes(state, 'normal'),
    );

    const handleValuesChange = useCallback(async () => {
        trigger();
        if (!customFeePerUnit || !formState) {
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
        customFeePerUnit,
        formState,
        customFeeLimit,
        dispatch,
        accountKey,
        networkType,
        setError,
        translate,
    ]);

    useEffect(() => {
        // we don't support custom fee for solana
        if (networkType === 'solana') {
            return;
        }

        setIsFeeLoading(true);
        debounce(handleValuesChange);
    }, [watchedFeePerUnit, watchedFeeLimit, handleValuesChange, debounce, networkType]);

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

    const hasFeePerByteError = G.isNotNullable(errors[FEE_PER_UNIT_FIELD_NAME]);
    const isSubmittable =
        G.isNotNullable(customFeeLevel) && !hasFeePerByteError && !isErrorBoxVisible;

    return { feeValue, isFeeLoading, isErrorBoxVisible, isSubmittable };
};
