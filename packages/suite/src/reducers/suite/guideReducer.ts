import { type Action as ReduxAction } from 'redux';

import type { ActiveView, GuideCategory, GuideNode } from '@suite-common/suite-types';
import { variables } from '@trezor/components';
import * as indexNodeJSON from '@trezor/suite-data/files/guide/index.json';

import { GUIDE } from 'src/actions/suite/constants';
import { type GuideAction } from 'src/actions/suite/guideActions';

export interface GuideState {
    open: boolean;
    view: ActiveView;
    indexNode: GuideCategory | null;
    currentNode: GuideNode | null;
    width: number;
}

const indexNode = indexNodeJSON as GuideCategory;

export const initialState: GuideState = {
    open: false,
    view: 'GUIDE_DEFAULT',
    indexNode,
    currentNode: null,
    width: variables.LAYOUT_SIZE.GUIDE_PANEL_DEFAULT_WIDTH,
};

// NOTE: we cannot use immer in this reducer, because GuideCategory mimics the react node and immer uses Object.freeze()
const guideReducer = (state: GuideState = initialState, action: ReduxAction): GuideState => {
    const guideAction = action as GuideAction;

    switch (guideAction.type) {
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
                view: guideAction.payload,
            };
        case GUIDE.SET_INDEX_NODE:
            return {
                ...state,
                indexNode: guideAction.payload,
            };
        case GUIDE.UNSET_NODE:
            return {
                ...state,
                currentNode: null,
            };
        case GUIDE.OPEN_NODE:
            return {
                ...state,
                currentNode: guideAction.payload,
            };
        case GUIDE.SET_WIDTH:
            return {
                ...state,
                width: guideAction.payload,
            };
        default:
            return state;
    }
};

export default guideReducer;
