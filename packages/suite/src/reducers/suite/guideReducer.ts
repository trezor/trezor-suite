import produce from 'immer';
import { Action } from 'src/types/suite';
import { GUIDE } from 'src/actions/suite/constants';
import type { ActiveView, GuideCategory, GuideNode } from '@suite-common/suite-types';
import * as indexNodeJSON from '@trezor/suite-data/files/guide/index.json';

export interface State {
    open: boolean;
    view: ActiveView;
    indexNode: GuideCategory | null;
    currentNode: GuideNode | null;
}

const indexNode = indexNodeJSON as GuideCategory;

export const initialState: State = {
    open: false,
    view: 'GUIDE_DEFAULT',
    indexNode,
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
