import { type GuideState } from 'src/reducers/suite/guideReducer';

export type GuideRootState = {
    guide: GuideState;
};

export const selectIsGuideOpen = (state: GuideRootState) => state.guide.open;
export const selectGuideView = (state: GuideRootState) => state.guide.view;
export const selectGuideIndexNode = (state: GuideRootState) => state.guide.indexNode;
export const selectGuideCurrentNode = (state: GuideRootState) => state.guide.currentNode;
export const selectGuideWidth = (state: GuideRootState) => state.guide.width;
