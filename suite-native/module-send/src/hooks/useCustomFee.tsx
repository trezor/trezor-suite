import { useState, useCallback, useEffect, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';

import { isRejected } from '@reduxjs/toolkit';
import { G } from '@mobily/ts-belt';

import { AccountsRootState, selectAccountNetworkType } from '@suite-common/wallet-core';
import {
    AccountKey,
    isFinalPrecomposedTransaction,
    TokenAddress,
} from '@suite-common/wallet-types';
import { useTranslate } from '@suite-native/intl';
import { useDebounce } from '@trezor/react-utils';
import { BigNumber } from '@trezor/utils';
import { useFormContext } from '@suite-native/forms';

import { SendFeesFormValues } from '../sendFeesFormSchema';
import {
    selectCustomFeeLevel,
    NativeSendRootState,
    selectFeeLevelTransactionBytes,
} from '../sendFormSlice';
import { calculateCustomFeeLevelThunk } from '../sendFormThunks';

type UseCustomFeeProps = {
    accountKey: AccountKey;
    tokenContract?: TokenAddress;
};

export const useCustomFee = ({ accountKey, tokenContract }: UseCustomFeeProps) => {
    const dispatch = useDispatch();
    const debounce = useDebounce();
    const { translate } = useTranslate();

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
    } = useFormContext<SendFeesFormValues>();

    const feePerUnitFieldName = 'customFeePerUnit';
    const feeLimitFieldName = 'customFeeLimit';

    const watchedFeePerUnit = watch(feePerUnitFieldName, '0');
    const watchedFeeLimit = watch(feeLimitFieldName, '1') as string;

    const normalLevelTransactionBytes = useSelector((state: NativeSendRootState) =>
        selectFeeLevelTransactionBytes(state, 'normal'),
    );

    const handleValuesChange = useCallback(async () => {
        const { customFeePerUnit, customFeeLimit } = getValues();

        trigger();
        if (!customFeePerUnit) {
            setIsFeeLoading(false);

            return;
        }

        setIsFeeLoading(true);
        setIsErrorBoxVisible(false);
        const response = await dispatch(
            calculateCustomFeeLevelThunk({
                accountKey,
                tokenContract,
                feePerUnit: customFeePerUnit,
                feeLimit: customFeeLimit,
            }),
        );

        if (isRejected(response)) {
            if (networkType === 'ethereum') {
                setIsErrorBoxVisible(true);
            } else {
                setError(feePerUnitFieldName, {
                    message: translate('moduleSend.fees.error'),
                });
            }
        }

        setIsFeeLoading(false);
    }, [accountKey, dispatch, networkType, setError, tokenContract, translate, trigger, getValues]);

    useEffect(() => {
        setIsFeeLoading(true);
        debounce(handleValuesChange);
    }, [watchedFeePerUnit, watchedFeeLimit, handleValuesChange, debounce]);

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

    const hasFeePerByteError = G.isNotNullable(errors[feePerUnitFieldName]);
    const isSubmittable =
        G.isNotNullable(customFeeLevel) && !hasFeePerByteError && !isErrorBoxVisible;

    return { feeValue, isFeeLoading, isErrorBoxVisible, isSubmittable };
};
