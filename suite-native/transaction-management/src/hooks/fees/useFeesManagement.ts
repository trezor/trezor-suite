import { type AccountKey, type FeeLevelLabel, type TokenAddress } from '@suite-common/wallet-types';

import { useFeeCalculation } from './useFeeCalculation';
import { useFeeSelection } from './useFeeSelection';
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

    const feeSelection = useFeeSelection({
        accountKey,
        tokenContract,
        updateThunk,
        formDraftKey,
    });

    return {
        ...feeCalculation,
        ...feeSelection,
    };
};
