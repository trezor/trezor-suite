import type { FieldValues } from 'react-hook-form';

import { FormDraftRootState } from './formDraftSlice';

export const selectFormDraft = <T extends FieldValues>(
    { wallet }: FormDraftRootState,
    formDraftKey: string,
) => wallet.formDrafts[formDraftKey] as T | undefined;
