import { Dispatch, GetState } from '@suite-types';
import { getFormDraftKey } from '@suite-common/wallet-utils';
import { FORM_DRAFT } from './constants';

import type { FormDraftKeyPrefix, FormDraft } from '@wallet-types/form';

export type FormDraftAction =
    | {
          type: typeof FORM_DRAFT.STORE_DRAFT;
          key: string;
          formDraft: FormDraft;
      }
    | {
          type: typeof FORM_DRAFT.REMOVE_DRAFT;
          key: string;
      };

export const saveDraft =
    <T extends FormDraft>(prefix: FormDraftKeyPrefix) =>
    (key: string, formDraft: T) =>
    (dispatch: Dispatch) => {
        dispatch({
            type: FORM_DRAFT.STORE_DRAFT,
            key: getFormDraftKey(prefix, key),
            formDraft,
        });
    };

export const getDraft =
    <T extends FormDraft>(prefix: FormDraftKeyPrefix) =>
    (key: string) =>
    (_dispatch: Dispatch, getState: GetState) => {
        const { formDrafts } = getState().wallet;
        const formDraftKey = getFormDraftKey(prefix, key);
        const draft = formDrafts[formDraftKey];

        if (draft) {
            // draft is a read-only redux object. make a copy to be able to modify values
            return JSON.parse(JSON.stringify(draft)) as T;
        }
    };

export const removeDraft =
    (prefix: FormDraftKeyPrefix) => (key: string) => (dispatch: Dispatch, getState: GetState) => {
        const { formDrafts } = getState().wallet;
        const formDraftKey = getFormDraftKey(prefix, key);
        if (formDrafts[formDraftKey]) {
            dispatch({
                type: FORM_DRAFT.REMOVE_DRAFT,
                key: formDraftKey,
            });
        }
    };
