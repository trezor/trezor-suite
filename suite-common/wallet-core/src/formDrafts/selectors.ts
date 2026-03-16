import type { FieldValues } from 'react-hook-form';

import { createWeakMapSelector } from '@suite-common/redux-utils';

import { type FormDraftRootState } from './formDraftSlice';

const createMemoizedSelector = createWeakMapSelector.withTypes<FormDraftRootState>();

export const selectFormDraft = <T extends FieldValues>(
    { wallet }: FormDraftRootState,
    formDraftKey: string,
) => wallet.formDrafts[formDraftKey] as T | undefined;

export const selectDeepCopyOfFormDraft = createMemoizedSelector([selectFormDraft], formDraft =>
    formDraft ? JSON.parse(JSON.stringify(formDraft)) : undefined,
);
