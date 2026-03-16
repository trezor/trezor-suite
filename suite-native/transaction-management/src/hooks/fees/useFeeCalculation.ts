import { useMemo } from 'react';
import { useWatch } from 'react-hook-form';
import { useSelector } from 'react-redux';

import {
    type AccountsRootState,
    type FeesRootState,
    selectAccountByKey,
    selectConvertedNetworkFeeLevelFeePerUnit,
} from '@suite-common/wallet-core';
import {
    type AccountKey,
    type FeeLevelLabel,
    type GeneralPrecomposedTransactionFinal,
    type PrecomposedTransactionFinal,
    isFinalPrecomposedTransaction,
} from '@suite-common/wallet-types';
import { BigNumber } from '@trezor/utils';

import { useFeesFetching } from './useFeesFetching';
import { useFeesForm } from './useFeesForm';
import { selectFeeLevels } from '../../selectors';

type UseFeeCalculationParams = {
    accountKey: AccountKey;
    selectedFee?: FeeLevelLabel;
    selectedFeePerUnit?: string;
    selectedSetMaxOutputId?: number;
};

export const useFeeCalculation = ({
    accountKey,
    selectedFee,
    selectedFeePerUnit,
    selectedSetMaxOutputId,
}: UseFeeCalculationParams) => {
    const account = useSelector((state: AccountsRootState) =>
        selectAccountByKey(state, accountKey),
    );
    const feeLevels = useSelector(selectFeeLevels);
    const { symbol } = account ?? {};

    const normalFee = isFinalPrecomposedTransaction(feeLevels.normal)
        ? (feeLevels.normal as PrecomposedTransactionFinal)
        : null;

    const form = useFeesForm({
        accountKey,
        defaultFeeLevel: selectedFee,
        defaultFeePerUnit: selectedFeePerUnit,
    });

    const selectedFeeLevel = useWatch({ control: form.control, name: 'feeLevel' });
    const selectedFeeLevelTransaction = isFinalPrecomposedTransaction(feeLevels[selectedFeeLevel])
        ? (feeLevels[selectedFeeLevel] as GeneralPrecomposedTransactionFinal)
        : null;

    const feePerUnit = useSelector((state: FeesRootState) =>
        selectConvertedNetworkFeeLevelFeePerUnit(state, symbol, selectedFeeLevel),
    );

    const { areFeesLoading } = useFeesFetching({
        networkSymbol: symbol,
        isRefetchDisabled: selectedFeeLevel === 'custom' || selectedSetMaxOutputId !== undefined,
    });

    const transactionBytes = normalFee?.bytes as number;

    // If trezor-connect was not able to compose the fee level, we have calculate total amount locally.
    const mockedFee = useMemo(
        () =>
            normalFee
                ? BigNumber(transactionBytes)
                      .times(feePerUnit ?? normalFee.feePerByte)
                      .toString()
                : null,

        [transactionBytes, feePerUnit, normalFee],
    );

    const mockedTotalAmount = useMemo(
        () =>
            normalFee && !!mockedFee
                ? BigNumber(normalFee.totalSpent).minus(normalFee.fee).plus(mockedFee).toString()
                : null,
        [normalFee, mockedFee],
    );

    const isSubmittable = isFinalPrecomposedTransaction(selectedFeeLevelTransaction ?? undefined);

    // Use actual values if available, otherwise fall back to mocked values
    const totalAmount = selectedFeeLevelTransaction?.totalSpent ?? mockedTotalAmount;
    const fee = selectedFeeLevelTransaction?.fee ?? mockedFee;

    return {
        form,
        selectedFeeLevel,
        selectedFeeLevelTransaction,
        totalAmount,
        fee,
        isSubmittable,
        areFeesLoading,
        symbol,
        account,
        feeLevels,
    };
};
