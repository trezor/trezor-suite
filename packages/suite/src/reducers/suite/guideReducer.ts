import produce from 'immer';

import { Action } from '@suite-types';
import { GUIDE } from '@suite-actions/constants';

import type { ActiveView, Category, Node } from '@suite-types/guide';

export interface State {
    open: boolean;
    view: ActiveView;
    indexNode: Category | null;
    currentNode: Node | null;
}

export const initialState: State = {
    open: false,
    view: 'GUIDE_DEFAULT',
    indexNode: null,
    currentNode: null,
};

const guideReducer = (state: State = initialState, action: Action): State =>
    produce(state, draft => {
        switch (action.type) {
            case GUIDE.OPEN:
                draft.open = true;
                break;
            case GUIDE.CLOSE:
                draft.open = false;
                draft.view = 'GUIDE_DEFAULT';
                break;
            case GUIDE.SET_VIEW:
                draft.view = action.payload;
                break;
            case GUIDE.SET_INDEX_NODE:
                draft.indexNode = action.payload;
                break;
            case GUIDE.UNSET_NODE:
                draft.currentNode = null;
                break;
            case GUIDE.OPEN_NODE:
                draft.currentNode = action.payload;
                break;
            default:
                return state;
        }
    });

export default guideReducer;
