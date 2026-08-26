import type { UnknownAction } from '@reduxjs/toolkit';

import type { ActiveView, GuideCategory, GuideNode } from '@suite-common/suite-types';
import { variables } from '@trezor/components';
import * as indexNodeJSON from '@trezor/suite-data/files/guide/index.json';

import {
    close,
    open,
    openGuideNode,
    setGuideView,
    setIndexNode,
    setWidth,
    unsetNode,
} from 'src/actions/suite/guideActions';

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
const guideReducer = (state: GuideState = initialState, action: UnknownAction): GuideState => {
    if (open.match(action)) {
        return { ...state, open: true };
    }
    if (close.match(action)) {
        return { ...state, open: false, view: 'GUIDE_DEFAULT' };
    }
    if (setGuideView.match(action)) {
        return { ...state, view: action.payload };
    }
    if (setIndexNode.match(action)) {
        return { ...state, indexNode: action.payload };
    }
    if (unsetNode.match(action)) {
        return { ...state, currentNode: null };
    }
    if (openGuideNode.match(action)) {
        return { ...state, currentNode: action.payload };
    }
    if (setWidth.match(action)) {
        return { ...state, width: action.payload };
    }

    return state;
};

export default guideReducer;
