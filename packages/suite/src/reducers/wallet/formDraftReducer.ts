import { FieldValues } from 'react-hook-form';

import produce from 'immer';

import { STORAGE } from 'src/actions/suite/constants';
import { FORM_DRAFT } from 'src/actions/wallet/constants';
import { Action } from 'src/types/suite';

export interface FormDraftState {
    [key: string]: FieldValues;
}
export const initialState: FormDraftState = {};

const formDraftReducer = (state: FormDraftState = initialState, action: Action): FormDraftState =>
    produce(state, draft => {
        switch (action.type) {
            case STORAGE.LOAD:
                action.payload.formDrafts.forEach(d => {
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
