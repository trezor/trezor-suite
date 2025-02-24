import type { ActiveView, GuideCategory, GuideNode } from '@suite-common/suite-types';
import * as indexNodeJSON from '@trezor/suite-data/files/guide/index.json';

import { GUIDE } from 'src/actions/suite/constants';
import { Action } from 'src/types/suite';

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

// NOTE: we cannot use immer in this reducer, because GuideCategory mimics the react node and immer uses Object.freeze()
const guideReducer = (state: State = initialState, action: Action): State => {
    switch (action.type) {
        case GUIDE.OPEN:
            return {
                ...state,
                open: true,
            };
        case GUIDE.CLOSE:
            return {
                ...state,
                open: false,
                view: 'GUIDE_DEFAULT',
            };
        case GUIDE.SET_VIEW:
            return {
                ...state,
                view: action.payload,
            };
        case GUIDE.SET_INDEX_NODE:
            return {
                ...state,
                indexNode: action.payload,
            };
        case GUIDE.UNSET_NODE:
            return {
                ...state,
                currentNode: null,
            };
        case GUIDE.OPEN_NODE:
            return {
                ...state,
                currentNode: action.payload,
            };
        default:
            return state;
    }
};

export default guideReducer;
