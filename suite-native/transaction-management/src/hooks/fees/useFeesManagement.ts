import { useEffect } from 'react';

import { AccountKey, FeeLevelLabel, TokenAddress } from '@suite-common/wallet-types';

import { useFeeCalculation } from './useFeeCalculation';
import { useFeeSelection } from './useFeeSelection';
import { UpdateSelectedFeeLevelThunkParams } from '../../types';

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

    const feeSelection = useFeeSelection({
        accountKey,
        tokenContract,
        updateThunk,
        formDraftKey,
    });

    const hasNormalLevel = !!feeCalculation.feeLevels.normal;

    useEffect(() => {
        feeSelection.dispatchDefaultFee(selectedFee, hasNormalLevel);
    }, [selectedFee, hasNormalLevel, feeSelection]);

    return {
        ...feeCalculation,
        ...feeSelection,
    };
};
