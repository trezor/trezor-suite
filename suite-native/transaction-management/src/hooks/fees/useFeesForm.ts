import { useEffect, useRef } from 'react';
import { useSelector } from 'react-redux';

import type { TokenAddress } from '@suite-common/tokens';
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

export const getDefaultFeeLimit = (
    networkType: NetworkType | undefined,
    referenceFee: PrecomposedTransactionFinal | undefined,
): string | undefined => {
    if (networkType === 'tron') return referenceFee?.estimatedFeeLimit;

    return referenceFee?.feeLimit;
};

const CUSTOM_FEE_FIELDS = [
    'customFeePerUnit',
    'customFeeLimit',
    'customMaxFeePerGas',
    'customMaxPriorityFeePerGas',
] as const satisfies ReadonlyArray<keyof FeesFormValues>;

type CustomFeeField = (typeof CUSTOM_FEE_FIELDS)[number];

const syncCustomFeeDefaults = (
    networkType: NetworkType | undefined,
    form: UseFormReturn<FeesFormValues>,
    feePerUnit: string | undefined,
    referenceFee: PrecomposedTransactionFinal | undefined,
    fieldsThatHeldValue: ReadonlySet<CustomFeeField>,
) => {
    const values = form.getValues();
    const wasCleared = (name: CustomFeeField) => !values[name] && fieldsThatHeldValue.has(name);
    const shouldFillDefault = (name: CustomFeeField) => !values[name] && !wasCleared(name);

    if (shouldFillDefault('customFeePerUnit') && feePerUnit) {
        form.setValue('customFeePerUnit', feePerUnit);
    }
    const defaultFeeLimit = getDefaultFeeLimit(networkType, referenceFee);
    const shouldUpdateFeeLimit =
        networkType === 'tron'
            ? !wasCleared('customFeeLimit') && !!defaultFeeLimit
            : shouldFillDefault('customFeeLimit') && !!defaultFeeLimit;
    if (shouldFillDefault('customMaxFeePerGas') && referenceFee?.maxFeePerGas) {
        form.setValue('customMaxFeePerGas', referenceFee.maxFeePerGas);
    }
    if (shouldFillDefault('customMaxPriorityFeePerGas') && referenceFee?.maxPriorityFeePerGas) {
        form.setValue('customMaxPriorityFeePerGas', referenceFee.maxPriorityFeePerGas);
    }
    if (shouldUpdateFeeLimit) {
        form.setValue('customFeeLimit', defaultFeeLimit, { shouldValidate: true });
    }
};

export type UseFeesFormProps = {
    accountKey: AccountKey;
    tokenContract?: TokenAddress;
    defaultFeeLevel?: FeeLevelLabel;
    defaultFeePerUnit?: string;
};

export const useFeesForm = ({
    accountKey,
    tokenContract,
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

    const normalNetworkFee = networkFeeInfo?.levels?.find(level => level.label === 'normal');
    const trimmedFeePerUnit = getFeeValue({
        feeRate:
            defaultFeePerUnit || normalNetworkFee?.maxFeePerGas || normalNetworkFee?.feePerUnit,
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
            isTrc20: networkType === 'tron' && !!tokenContract,
        },
    });

    // Form dirtiness cannot tell a cleared field from a mounted one that never had a value.
    const fieldsThatHeldValueRef = useRef(new Set<CustomFeeField>());

    useEffect(() => {
        const rememberFieldsWithValue = (values: Partial<FeesFormValues>) => {
            CUSTOM_FEE_FIELDS.forEach(name => {
                if (values[name]) fieldsThatHeldValueRef.current.add(name);
            });
        };
        rememberFieldsWithValue(form.getValues());

        return form.subscribe({
            formState: { values: true },
            callback: ({ values }) => rememberFieldsWithValue(values),
        });
    }, [form]);

    useEffect(() => {
        syncCustomFeeDefaults(
            networkType,
            form,
            trimmedFeePerUnit,
            referenceFee,
            fieldsThatHeldValueRef.current,
        );
    }, [networkType, trimmedFeePerUnit, referenceFee, form]);

    return form;
};
