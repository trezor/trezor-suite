import { createThunk } from '@suite-common/redux-utils';
import { formDraftActions, selectDeepCopyOfFormDraft } from '@suite-common/wallet-core';
import { type UpdateSelectedFeeLevelThunkParams } from '@suite-native/transaction-management';

import { EARN_MODULE_PREFIX } from './constants';

/** Writes the picked fee level into the flow's form draft, shared by all earn fee selectors. */
export const updateEarnSelectedFeeLevelThunk = createThunk(
    `${EARN_MODULE_PREFIX}/updateSelectedFeeLevelThunk`,
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
        const formDraft = selectDeepCopyOfFormDraft(getState(), formDraftKey);
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
