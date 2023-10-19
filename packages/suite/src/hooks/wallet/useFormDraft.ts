import { FieldValues } from 'react-hook-form';

import { useActions } from 'src/hooks/suite';
import { FormDraftKeyPrefix } from '@suite-common/wallet-types';
import * as formDraftActions from 'src/actions/wallet/formDraftActions';

export const useFormDraft = <T extends FieldValues>(keyPrefix: FormDraftKeyPrefix) =>
    useActions({
        getDraft: formDraftActions.getDraft<T>(keyPrefix),
        saveDraft: formDraftActions.saveDraft<T>(keyPrefix),
        removeDraft: formDraftActions.removeDraft(keyPrefix),
    });
