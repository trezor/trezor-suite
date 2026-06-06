import { createThunk } from '@suite-common/redux-utils';
import { formDraftActions, selectDeepCopyOfFormDraft } from '@suite-common/wallet-core';
import { type FormState } from '@suite-common/wallet-types';
import { type UpdateSelectedFeeLevelThunkParams } from '@suite-native/transaction-management';

import { EARN_MODULE_PREFIX } from './constants';

export const getYieldClaimFormDraftKey = (flowKey: string) => `yield-claim/${flowKey}`;

export const updateYieldClaimSelectedFeeLevelThunk = createThunk(
    `${EARN_MODULE_PREFIX}/updateYieldClaimSelectedFeeLevelThunk`,
    (
        {
            feeLevelLabel,
            feePerUnit,
            feeLimit,
            formDraftKey,
            maxFeePerGas,
            maxPriorityFeePerGas,
        }: UpdateSelectedFeeLevelThunkParams,
        { dispatch, getState },
    ) => {
        if (!formDraftKey) return;

        const formDraft = selectDeepCopyOfFormDraft(getState(), formDraftKey) as
            | FormState
            | undefined;

        if (!formDraft) return;

        formDraft.selectedFee = feeLevelLabel;

        if (feePerUnit) {
            formDraft.feePerUnit = feePerUnit;
        }

        if (feeLimit) {
            formDraft.feeLimit = feeLimit;
        }

        if (maxFeePerGas) {
            formDraft.maxFeePerGas = maxFeePerGas;
        }

        if (maxPriorityFeePerGas) {
            formDraft.maxPriorityFeePerGas = maxPriorityFeePerGas;
        }

        dispatch(formDraftActions.storeDraft({ key: formDraftKey, formDraft }));
    },
);
