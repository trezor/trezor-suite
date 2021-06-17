import { useActions } from '@suite-hooks';
import { FormDraft, FormDraftKeyPrefix } from '@wallet-types/form';
import * as formDraftActions from '@wallet-actions/formDraftActions';

export const useFormDraft = <T extends FormDraft>(keyPrefix: FormDraftKeyPrefix) =>
    useActions({
        getDraft: formDraftActions.getDraft<T>(keyPrefix),
        saveDraft: formDraftActions.saveDraft<T>(keyPrefix),
        removeDraft: formDraftActions.removeDraft(keyPrefix),
    });
