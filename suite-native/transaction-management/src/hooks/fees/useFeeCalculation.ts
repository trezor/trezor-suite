import { useMemo } from 'react';
import { useWatch } from 'react-hook-form';
import { useSelector } from 'react-redux';

import {
    AccountsRootState,
    FeesRootState,
    selectAccountByKey,
    selectConvertedNetworkFeeLevelFeePerUnit,
} from '@suite-common/wallet-core';
import {
    AccountKey,
    FormState,
    GeneralPrecomposedTransactionFinal,
    PrecomposedTransactionFinal,
} from '@suite-common/wallet-types';
import { BigNumber } from '@trezor/utils';

import { useFeesFetching } from './useFeesFetching';
import { useFeesForm } from './useFeesForm';
import { selectFeeLevels } from '../../selectors';
import { NativeSupportedFeeLevel } from '../../types';

type UseFeeCalculationParams = {
    accountKey: AccountKey;
    formDraft: FormState | undefined | null;
};

export const useFeeCalculation = ({ accountKey, formDraft }: UseFeeCalculationParams) => {
    const account = useSelector((state: AccountsRootState) =>
        selectAccountByKey(state, accountKey),
    );
    const feeLevels = useSelector(selectFeeLevels);
    const { symbol } = account ?? {};

    const form = useFeesForm({
        accountKey,
        defaultFeeLevel: formDraft?.selectedFee as NativeSupportedFeeLevel,
        defaultFeePerUnit: formDraft?.feePerUnit,
    });

    const selectedFeeLevel = useWatch({ control: form.control, name: 'feeLevel' });
    const selectedFeeLevelTransaction = feeLevels[
        selectedFeeLevel
    ] as GeneralPrecomposedTransactionFinal;

    const feePerUnit = useSelector((state: FeesRootState) =>
        selectConvertedNetworkFeeLevelFeePerUnit(state, symbol, selectedFeeLevel),
    );

    const normalFee = feeLevels.normal as PrecomposedTransactionFinal;

    const { areFeesLoading } = useFeesFetching({
        accountKey,
        isRefetchDisabled: selectedFeeLevel === 'custom' || formDraft?.setMaxOutputId !== undefined,
    });

    const transactionBytes = normalFee.bytes as number;

    // If trezor-connect was not able to compose the fee level, we have calculate total amount locally.
    const mockedFee = useMemo(
        () =>
            BigNumber(transactionBytes)
                .times(feePerUnit ?? normalFee.feePerByte)
                .toString(),
        [transactionBytes, feePerUnit, normalFee.feePerByte],
    );

    const mockedTotalAmount = useMemo(
        () => BigNumber(normalFee.totalSpent).minus(normalFee.fee).plus(mockedFee).toString(),
        [normalFee, mockedFee],
    );

    const isSubmittable = selectedFeeLevelTransaction?.type === 'final';

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
