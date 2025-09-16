import { FormDraftRootState } from './formDraftSlice';

export const selectFormDraft = ({ wallet }: FormDraftRootState, formDraftKey: string) =>
    wallet.formDrafts[formDraftKey];
