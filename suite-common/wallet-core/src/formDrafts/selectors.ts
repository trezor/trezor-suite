import type { FieldValues } from 'react-hook-form';

import { createWeakMapSelector } from '@suite-common/redux-utils';

import { type FormDraftRootState } from './formDraftSlice';

const createMemoizedSelector = createWeakMapSelector.withTypes<FormDraftRootState>();

export const selectFormDraftKeys = (state: FormDraftRootState) =>
    Object.keys(state.wallet.formDrafts);

export const selectFormDraft = <T extends FieldValues>(
    { wallet }: FormDraftRootState,
    formDraftKey: string,
) => wallet.formDrafts[formDraftKey] as T | undefined;

// Drafts are plain form values, which a JSON round trip copies faster than `structuredClone`;
// on React Native `structuredClone` is a JS polyfill.
export const selectDeepCopyOfFormDraft = createMemoizedSelector([selectFormDraft], formDraft =>
    formDraft ? JSON.parse(JSON.stringify(formDraft)) : undefined,
);
