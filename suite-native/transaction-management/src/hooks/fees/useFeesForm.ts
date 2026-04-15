import { useEffect } from 'react';
import { useSelector } from 'react-redux';

import { type NetworkType, getNetworkType } from '@suite-common/wallet-config';
import {
    type AccountsRootState,
    type FeesRootState,
    selectAccountByKey,
    selectConvertedNetworkFeeInfo,
    selectIsEip1559Fee,
} from '@suite-common/wallet-core';
import {
    type AccountKey,
    type FeeLevelLabel,
    type PrecomposedTransactionFinal,
    isFinalPrecomposedTransaction,
} from '@suite-common/wallet-types';
import { type UseFormReturn, useForm } from '@suite-native/forms';
import { useTranslate } from '@suite-native/intl';

import { type FeesFormValues, feesFormValidationSchema } from '../../feesFormSchema';
import { selectFeeLevels } from '../../selectors';
import { getFeeValue } from '../../utils';

const getDefaultFeeLimit = (
    networkType: NetworkType | undefined,
    normalFee: PrecomposedTransactionFinal | undefined,
): string | undefined => {
    if (networkType === 'tron') return normalFee?.estimatedFeeLimit;

    return normalFee?.feeLimit;
};

const syncCustomFeeDefaults = (
    networkType: NetworkType | undefined,
    form: UseFormReturn<FeesFormValues>,
    feePerUnit: string | undefined,
    normalFee: PrecomposedTransactionFinal | undefined,
) => {
    const values = form.getValues();

    if (!values.customFeePerUnit && feePerUnit) {
        form.setValue('customFeePerUnit', feePerUnit);
    }
    const defaultFeeLimit = getDefaultFeeLimit(networkType, normalFee);
    const shouldUpdateFeeLimit =
        networkType === 'tron' ? !!defaultFeeLimit : !values.customFeeLimit && !!defaultFeeLimit;
    if (shouldUpdateFeeLimit) {
        form.setValue('customFeeLimit', defaultFeeLimit, { shouldValidate: true });
    }
    if (!values.customMaxFeePerGas && normalFee?.maxFeePerGas) {
        form.setValue('customMaxFeePerGas', normalFee.maxFeePerGas);
    }
    if (!values.customMaxPriorityFeePerGas && normalFee?.maxPriorityFeePerGas) {
        form.setValue('customMaxPriorityFeePerGas', normalFee.maxPriorityFeePerGas);
    }
};

export type UseFeesFormProps = {
    accountKey: AccountKey;
    defaultFeeLevel?: FeeLevelLabel;
    defaultFeePerUnit?: string;
};

export const useFeesForm = ({
    accountKey,
    defaultFeeLevel,
    defaultFeePerUnit,
}: UseFeesFormProps) => {
    const account = useSelector((state: AccountsRootState) =>
        selectAccountByKey(state, accountKey),
    );

    const { translate } = useTranslate();

    const feeLevels = useSelector(selectFeeLevels);

    const networkFeeInfo = useSelector((state: FeesRootState) =>
        selectConvertedNetworkFeeInfo(state, account?.symbol),
    );

    const isEip1559Fee = useSelector((state: FeesRootState) =>
        selectIsEip1559Fee(state, account?.symbol),
    );

    const trimmedFeePerUnit = getFeeValue({
        feeRate: defaultFeePerUnit,
        symbol: account?.symbol,
    });

    const minimalFeeLimit =
        feeLevels.normal && 'estimatedFeeLimit' in feeLevels.normal
            ? feeLevels.normal.estimatedFeeLimit
            : undefined;

    const normalFee = isFinalPrecomposedTransaction(feeLevels.normal)
        ? (feeLevels.normal as PrecomposedTransactionFinal)
        : undefined;

    const networkType = account?.symbol ? getNetworkType(account.symbol) : undefined;

    const form = useForm<FeesFormValues>({
        validation: feesFormValidationSchema,
        defaultValues: {
            feeLevel: defaultFeeLevel,
            customFeePerUnit: trimmedFeePerUnit,
            customFeeLimit: getDefaultFeeLimit(networkType, normalFee),
            customMaxFeePerGas: normalFee?.maxFeePerGas,
            customMaxPriorityFeePerGas: normalFee?.maxPriorityFeePerGas,
        },
        context: {
            networkFeeInfo,
            symbol: account?.symbol,
            minimalFeeLimit,
            translate,
            isEip1559Fee,
        },
    });

    useEffect(() => {
        syncCustomFeeDefaults(networkType, form, trimmedFeePerUnit, normalFee);
    }, [networkType, trimmedFeePerUnit, normalFee, form]);

    return form;
};
