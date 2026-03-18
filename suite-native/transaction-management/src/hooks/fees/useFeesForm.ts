import { useSelector } from 'react-redux';

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
import { useForm } from '@suite-native/forms';
import { useTranslate } from '@suite-native/intl';

import { type FeesFormValues, feesFormValidationSchema } from '../../feesFormSchema';
import { selectFeeLevels } from '../../selectors';
import { getFeeValue } from '../../utils';

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

    return useForm<FeesFormValues>({
        validation: feesFormValidationSchema,
        defaultValues: {
            feeLevel: defaultFeeLevel,
            customFeePerUnit: trimmedFeePerUnit,
            customFeeLimit: normalFee?.feeLimit,
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
};
