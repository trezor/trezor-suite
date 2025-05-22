import { useCallback } from 'react';
import { FieldValues } from 'react-hook-form';

import { FormDraftKeyPrefix } from '@suite-common/wallet-types';

import * as formDraftActions from 'src/actions/wallet/formDraftActions';
import { useDispatch } from 'src/hooks/suite';

export const useFormDraft = <T extends FieldValues>(keyPrefix: FormDraftKeyPrefix) => {
    const dispatch = useDispatch();

    const getDraft = useCallback(
        (key: string) => dispatch(formDraftActions.getDraft<T>(keyPrefix)(key)),
        [dispatch, keyPrefix],
    );

    const saveDraft = useCallback(
        (key: string, data: T) => dispatch(formDraftActions.saveDraft<T>(keyPrefix)(key, data)),
        [dispatch, keyPrefix],
    );

    const removeDraft = useCallback(
        (key: string) => dispatch(formDraftActions.removeDraft(keyPrefix)(key)),
        [dispatch, keyPrefix],
    );

    return {
        getDraft,
        saveDraft,
        removeDraft,
    };
};
