import { useCallback, useRef } from 'react';

import type {
    AccountKey,
    FeeLevelLabel,
    GeneralPrecomposedLevels,
    TokenAddress,
} from '@suite-common/wallet-types';
import { isFinalPrecomposedTransaction } from '@suite-common/wallet-types';
import { events, injectNativeAnalytics } from '@suite-native/analytics';
import { useServices } from '@trezor/dependency-injection';
import { injectDispatch } from '@trezor/redux-utils';

import { transactionManagementActions } from '../../sendFormSlice';
import { type UpdateSelectedFeeLevelThunkParams } from '../../types';

type UseFeeSelectionParams = {
    accountKey: AccountKey;
    tokenContract?: TokenAddress;
    updateThunk: (params: UpdateSelectedFeeLevelThunkParams) => any;
    formDraftKey?: string;
};

export type CustomFeeParams = {
    customFeeLevels?: GeneralPrecomposedLevels;
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
    const { analytics, dispatch } = useServices(injectNativeAnalytics, injectDispatch);
    const handleFeeLevelChange = useCallback(
        async (
            feeLevel: FeeLevelLabel,
            {
                customFeeLevels,
                customFeePerUnit,
                customFeeLimit,
                customMaxFeePerGas,
                customMaxPriorityFeePerGas,
            }: CustomFeeParams = {},
        ) => {
            analytics.report({
                type: events.sendFeeLevelChangedEvent.name,
                payload: { value: feeLevel },
            });

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

            if (feeLevel === 'custom' && isFinalPrecomposedTransaction(customFeeLevels?.custom)) {
                dispatch(
                    transactionManagementActions.storeCustomFeeLevel({
                        feeLevel: customFeeLevels.custom,
                    }),
                );
            }
            // Standard levels belong to the flow that composed the transaction. Confirming
            // Custom must not replace them with the preview estimator's standard levels.
            await dispatch(updateThunk(thunkParams));
        },
        [analytics, dispatch, updateThunk, accountKey, tokenContract, formDraftKey],
    );

    const handleCustomFeeSet = useCallback(
        ({
            customFeeLevels,
            customFeePerUnit,
            customFeeLimit,
            customMaxFeePerGas,
            customMaxPriorityFeePerGas,
        }: CustomFeeParams) =>
            handleFeeLevelChange('custom', {
                customFeeLevels,
                customFeePerUnit,
                customFeeLimit,
                customMaxFeePerGas,
                customMaxPriorityFeePerGas,
            }),
        [handleFeeLevelChange],
    );

    const hasDispatchedDefaultFee = useRef(false);

    // pre-select default 'normal' fee level without analytics if fee is not already set
    const dispatchDefaultFee = useCallback(() => {
        if (hasDispatchedDefaultFee.current) {
            return;
        }
        hasDispatchedDefaultFee.current = true;

        dispatch(
            updateThunk({
                accountKey,
                tokenContract,
                feeLevelLabel: 'normal',
                formDraftKey,
            }),
        );
    }, [dispatch, updateThunk, accountKey, tokenContract, formDraftKey]);

    return { handleFeeLevelChange, handleCustomFeeSet, dispatchDefaultFee };
};
