import { FORM_DRAFT } from 'src/actions/wallet/constants';
import produce from 'immer';
import { Action } from 'src/types/suite';
import { FormDraft } from 'src/types/wallet/form';
import { STORAGE } from 'src/actions/suite/constants';

export interface FormDraftState {
    [key: string]: FormDraft;
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
