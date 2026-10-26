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
import type {
    AccountKey,
    FeeLevelLabel,
    PrecomposedTransactionFinal,
} from '@suite-common/wallet-types';
import { isFinalPrecomposedTransaction } from '@suite-common/wallet-types';
import { type UseFormReturn, useForm } from '@suite-native/forms';
import { useTranslate } from '@suite-native/intl';

import { getReferenceFeeLevel } from './referenceFeeLevel';
import { type FeesFormValues, feesFormValidationSchema } from '../../feesFormSchema';
import { selectFeeLevels } from '../../selectors';
import { getFeeValue } from '../../utils';

const getDefaultFeeLimit = (
    networkType: NetworkType | undefined,
    referenceFee: PrecomposedTransactionFinal | undefined,
): string | undefined => {
    if (networkType === 'tron') return referenceFee?.estimatedFeeLimit;

    return referenceFee?.feeLimit;
};

const syncCustomFeeDefaults = (
    networkType: NetworkType | undefined,
    form: UseFormReturn<FeesFormValues>,
    feePerUnit: string | undefined,
    referenceFee: PrecomposedTransactionFinal | undefined,
) => {
    const values = form.getValues();

    if (!values.customFeePerUnit && feePerUnit) {
        form.setValue('customFeePerUnit', feePerUnit);
    }
    const defaultFeeLimit = getDefaultFeeLimit(networkType, referenceFee);
    const shouldUpdateFeeLimit =
        networkType === 'tron' ? !!defaultFeeLimit : !values.customFeeLimit && !!defaultFeeLimit;
    if (!values.customMaxFeePerGas && referenceFee?.maxFeePerGas) {
        form.setValue('customMaxFeePerGas', referenceFee.maxFeePerGas);
    }
    if (!values.customMaxPriorityFeePerGas && referenceFee?.maxPriorityFeePerGas) {
        form.setValue('customMaxPriorityFeePerGas', referenceFee.maxPriorityFeePerGas);
    }
    if (shouldUpdateFeeLimit) {
        form.setValue('customFeeLimit', defaultFeeLimit, { shouldValidate: true });
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

    const referenceFee = getReferenceFeeLevel(feeLevels);
    const networkType = account?.symbol ? getNetworkType(account.symbol) : undefined;
    const customEstimate = isFinalPrecomposedTransaction(feeLevels.custom)
        ? feeLevels.custom.estimatedFeeLimit
        : undefined;
    const minimalFeeLimit =
        referenceFee?.estimatedFeeLimit ??
        (networkType === 'ethereum' ? (referenceFee?.feeLimit ?? customEstimate) : undefined);

    const form = useForm<FeesFormValues>({
        validation: feesFormValidationSchema,
        defaultValues: {
            feeLevel: defaultFeeLevel,
            customFeePerUnit: trimmedFeePerUnit,
            customFeeLimit: getDefaultFeeLimit(networkType, referenceFee),
            customMaxFeePerGas: referenceFee?.maxFeePerGas,
            customMaxPriorityFeePerGas: referenceFee?.maxPriorityFeePerGas,
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
        syncCustomFeeDefaults(networkType, form, trimmedFeePerUnit, referenceFee);
    }, [networkType, trimmedFeePerUnit, referenceFee, form]);

    return form;
};
