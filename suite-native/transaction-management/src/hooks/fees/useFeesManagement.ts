import { useEffect } from 'react';
import { useSelector } from 'react-redux';

import {
    type AccountKey,
    type FeeLevelLabel,
    type TokenAddress,
    isFinalPrecomposedTransaction,
} from '@suite-common/wallet-types';

import { useFeeCalculation } from './useFeeCalculation';
import { useFeeSelection } from './useFeeSelection';
import { selectFeeLevels } from '../../selectors';
import { type UpdateSelectedFeeLevelThunkParams } from '../../types';

type UseFeesManagementParams = {
    accountKey: AccountKey;
    selectedFee?: FeeLevelLabel;
    selectedFeePerUnit?: string;
    selectedSetMaxOutputId?: number;
    tokenContract?: TokenAddress;
    updateThunk: (params: UpdateSelectedFeeLevelThunkParams) => any;
    formDraftKey?: string;
};

export const useFeesManagement = ({
    accountKey,
    selectedFee,
    selectedFeePerUnit,
    selectedSetMaxOutputId,
    tokenContract,
    updateThunk,
    formDraftKey,
}: UseFeesManagementParams) => {
    const feeCalculation = useFeeCalculation({
        accountKey,
        selectedFee,
        selectedFeePerUnit,
        selectedSetMaxOutputId,
    });

    const { dispatchDefaultFee, ...feeSelection } = useFeeSelection({
        accountKey,
        tokenContract,
        updateThunk,
        formDraftKey,
    });

    const feeLevels = useSelector(selectFeeLevels);
    const isNormalFeeReady = isFinalPrecomposedTransaction(feeLevels.normal);

    useEffect(() => {
        if (selectedFee === undefined && isNormalFeeReady) {
            dispatchDefaultFee();
        }
    }, [selectedFee, isNormalFeeReady, dispatchDefaultFee]);

    return {
        ...feeCalculation,
        ...feeSelection,
        dispatchDefaultFee,
    };
};
