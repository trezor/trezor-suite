import { useSelector } from 'react-redux';

import {
    AccountsRootState,
    FeesRootState,
    selectAccountByKey,
    selectConvertedNetworkFeeInfo,
} from '@suite-common/wallet-core';
import { AccountKey, PrecomposedTransactionFinal } from '@suite-common/wallet-types';
import { useForm } from '@suite-native/forms';

import { FeesFormValues, feesFormValidationSchema } from '../feesFormSchema';
import { selectFeeLevels } from '../selectors';
import { NativeSupportedFeeLevel } from '../types/fees';
import { getFeeValue } from '../utils';

export type UseFeesFormProps = {
    accountKey: AccountKey;
    defaultFeeLevel?: NativeSupportedFeeLevel;
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

    const feeLevels = useSelector(selectFeeLevels);

    const networkFeeInfo = useSelector((state: FeesRootState) =>
        selectConvertedNetworkFeeInfo(state, account?.symbol),
    );

    const trimmedFeePerUnit = getFeeValue({
        feeRate: defaultFeePerUnit,
        symbol: account?.symbol,
    });

    const minimalFeeLimit =
        'estimatedFeeLimit' in feeLevels.normal ? feeLevels.normal.estimatedFeeLimit : undefined;

    const normalFee = feeLevels.normal as PrecomposedTransactionFinal; // user is not allowed to enter this screen if normal fee is not final

    return useForm<FeesFormValues>({
        validation: feesFormValidationSchema,
        defaultValues: {
            feeLevel: defaultFeeLevel,
            customFeePerUnit: trimmedFeePerUnit,
            customFeeLimit: normalFee?.feeLimit,
        },
        context: {
            networkFeeInfo,
            symbol: account?.symbol,
            minimalFeeLimit,
        },
    });
};
