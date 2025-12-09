import { useCallback } from 'react';
import { useDispatch } from 'react-redux';

import { AccountKey, FeeLevelLabel, TokenAddress } from '@suite-common/wallet-types';
import { EventType, analytics } from '@suite-native/analytics';

import { UpdateSelectedFeeLevelThunkParams } from '../../types';

type UseFeeSelectionParams = {
    accountKey: AccountKey;
    tokenContract?: TokenAddress;
    updateThunk: (params: UpdateSelectedFeeLevelThunkParams) => any;
    formDraftKey?: string;
};

export type CustomFeeParams = {
    customFeePerUnit?: string;
    customFeeLimit?: string;
    customMaxFeePerGas?: string;
    customMaxPriorityFeePerGas?: string;
};

export const useFeeSelection = ({
    accountKey,
    tokenContract,
    updateThunk,
    formDraftKey,
}: UseFeeSelectionParams) => {
    const dispatch = useDispatch();

    const handleFeeLevelChange = useCallback(
        (
            feeLevel: FeeLevelLabel,
            {
                customFeePerUnit,
                customFeeLimit,
                customMaxFeePerGas,
                customMaxPriorityFeePerGas,
            }: CustomFeeParams = {},
        ) => {
            analytics.report({ type: EventType.SendFeeLevelChanged, payload: { value: feeLevel } });

            let thunkParams: UpdateSelectedFeeLevelThunkParams;
            if (feeLevel === 'custom') {
                thunkParams = {
                    accountKey,
                    tokenContract,
                    feeLevelLabel: 'custom',
                    feePerUnit: customFeePerUnit!,
                    feeLimit: customFeeLimit,
                    maxFeePerGas: customMaxFeePerGas,
                    maxPriorityFeePerGas: customMaxPriorityFeePerGas,
                    formDraftKey,
                };
            } else {
                thunkParams = {
                    accountKey,
                    tokenContract,
                    feeLevelLabel: feeLevel,
                    formDraftKey,
                };
            }

            dispatch(updateThunk(thunkParams));
        },
        [dispatch, updateThunk, formDraftKey, accountKey, tokenContract],
    );

    const handleCustomFeeSet = useCallback(
        ({
            customFeePerUnit,
            customFeeLimit,
            customMaxFeePerGas,
            customMaxPriorityFeePerGas,
        }: CustomFeeParams) => {
            handleFeeLevelChange('custom', {
                customFeePerUnit,
                customFeeLimit,
                customMaxFeePerGas,
                customMaxPriorityFeePerGas,
            });
        },
        [handleFeeLevelChange],
    );

    return { handleFeeLevelChange, handleCustomFeeSet };
};
