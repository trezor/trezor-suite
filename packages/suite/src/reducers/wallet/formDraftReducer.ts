import { produce } from 'immer';

import {
    FormDraftAction,
    FormDraftState,
    formDraftReducer as commonFormDraftReducer,
    formDraftInitialState,
} from '@suite-common/wallet-core';

import { STORAGE } from 'src/actions/suite/constants';
import { Action } from 'src/types/suite';

const formDraftReducer = (
    state: FormDraftState = formDraftInitialState,
    action: Action,
): FormDraftState =>
    produce(state, draft => {
        switch (action.type) {
            case STORAGE.LOAD:
                action.payload.formDrafts.forEach(d => {
                    draft[d.key] = d.value;
                });
                break;

            default:
                commonFormDraftReducer(state, action as FormDraftAction);
        }
    });

export default formDraftReducer;
