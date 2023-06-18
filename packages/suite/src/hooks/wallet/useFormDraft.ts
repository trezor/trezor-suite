import { useActions } from 'src/hooks/suite';
import { FormDraft, FormDraftKeyPrefix } from 'src/types/wallet/form';
import * as formDraftActions from 'src/actions/wallet/formDraftActions';

export const useFormDraft = <T extends FormDraft>(keyPrefix: FormDraftKeyPrefix) =>
    useActions({
        getDraft: formDraftActions.getDraft<T>(keyPrefix),
        saveDraft: formDraftActions.saveDraft<T>(keyPrefix),
        removeDraft: formDraftActions.removeDraft(keyPrefix),
    });
