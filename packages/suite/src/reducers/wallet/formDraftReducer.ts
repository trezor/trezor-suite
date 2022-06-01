import { FORM_DRAFT } from '@wallet-actions/constants';
import produce from 'immer';
import { Action } from '@suite-types';
import { FormDraft } from '@wallet-types/form';
import { STORAGE } from '@suite/actions/suite/constants';

export interface FormDraftState {
    [key: string]: FormDraft;
}
export const initialState: FormDraftState = {};

const formDraftReducer = (state: FormDraftState = initialState, action: Action): FormDraftState =>
    produce(state, draft => {
        switch (action.type) {
            case STORAGE.LOAD:
                action.payload?.formDrafts.forEach(d => {
                    draft[d.key] = d.value;
                });
                break;
            case FORM_DRAFT.STORE_DRAFT:
                draft[action.key] = action.formDraft;
                break;
            case FORM_DRAFT.REMOVE_DRAFT:
                delete draft[action.key];
                break;
            // no default
        }
    });

export default formDraftReducer;
