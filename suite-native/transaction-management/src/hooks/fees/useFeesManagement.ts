import { AccountKey, FormState, TokenAddress } from '@suite-common/wallet-types';

import { useFeeCalculation } from './useFeeCalculation';
import { useFeeSelection } from './useFeeSelection';
import { UpdateSelectedFeeLevelThunkParams } from '../../types';

type UseFeesManagementParams = {
    accountKey: AccountKey;
    formDraft: FormState | undefined | null;
    tokenContract?: TokenAddress;
    updateThunk: (params: UpdateSelectedFeeLevelThunkParams) => any;
};

export const useFeesManagement = ({
    accountKey,
    formDraft,
    tokenContract,
    updateThunk,
}: UseFeesManagementParams) => {
    const feeCalculation = useFeeCalculation({ accountKey, formDraft });

    const feeSelection = useFeeSelection({
        accountKey,
        tokenContract,
        updateThunk,
    });

    return {
        ...feeCalculation,
        ...feeSelection,
    };
};
