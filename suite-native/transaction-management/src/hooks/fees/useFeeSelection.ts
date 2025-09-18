import { useCallback } from 'react';
import { useDispatch } from 'react-redux';

import { AccountKey, TokenAddress } from '@suite-common/wallet-types';
import { EventType, analytics } from '@suite-native/analytics';

import { NativeSupportedFeeLevel, UpdateSelectedFeeLevelThunkParams } from '../../types';

type UseFeeSelectionParams = {
    accountKey: AccountKey;
    tokenContract?: TokenAddress;
    updateThunk: (params: UpdateSelectedFeeLevelThunkParams) => any;
};

export const useFeeSelection = ({
    accountKey,
    tokenContract,
    updateThunk,
}: UseFeeSelectionParams) => {
    const dispatch = useDispatch();

    const handleFeeLevelChange = useCallback(
        (feeLevel: NativeSupportedFeeLevel, customFeePerUnit?: string, customFeeLimit?: string) => {
            analytics.report({ type: EventType.SendFeeLevelChanged, payload: { value: feeLevel } });

            let thunkParams: UpdateSelectedFeeLevelThunkParams;
            if (feeLevel === 'custom') {
                thunkParams = {
                    accountKey,
                    tokenContract,
                    feeLevelLabel: 'custom',
                    feePerUnit: customFeePerUnit!,
                    feeLimit: customFeeLimit,
                };
            } else {
                thunkParams = {
                    accountKey,
                    tokenContract,
                    feeLevelLabel: feeLevel,
                };
            }
            dispatch(updateThunk(thunkParams));
        },
        [accountKey, tokenContract, updateThunk, dispatch],
    );

    const handleCustomFeeSet = useCallback(
        (customFeePerUnit: string, customFeeLimit?: string) => {
            handleFeeLevelChange('custom', customFeePerUnit, customFeeLimit);
        },
        [handleFeeLevelChange],
    );

    return { handleFeeLevelChange, handleCustomFeeSet };
};
