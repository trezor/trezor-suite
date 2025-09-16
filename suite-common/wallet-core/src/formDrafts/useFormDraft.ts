import { useCallback } from 'react';
import { FieldValues } from 'react-hook-form';
import { useDispatch, useSelector } from 'react-redux';

import { FormDraftKeyPrefix } from '@suite-common/wallet-types';
import { getFormDraftKey } from '@suite-common/wallet-utils';

import { FormDraftRootState, formDraftActions } from './formDraftSlice';
import { selectFormDraft } from './selectors';

export const useFormDraft = <T extends FieldValues>(
    keyPrefix: FormDraftKeyPrefix,
    key: string = '',
) => {
    const dispatch = useDispatch();

    const formDraftKey = getFormDraftKey(keyPrefix, key);

    const draft = useSelector((state: FormDraftRootState) =>
        selectFormDraft(state, formDraftKey),
    ) as T | undefined;

    const saveDraft = useCallback(
        (formDraft: T) => {
            dispatch(formDraftActions.storeDraft({ key: formDraftKey, formDraft }));
        },
        [dispatch, formDraftKey],
    );

    const removeDraft = useCallback(() => {
        dispatch(formDraftActions.removeDraft({ key: formDraftKey }));
    }, [dispatch, formDraftKey]);

    return { draft, saveDraft, removeDraft };
};
