import type { ActiveView, GuideCategory, GuideNode } from '@suite-common/suite-types';

export interface GuideState {
    open: boolean;
    view: ActiveView;
    indexNode: GuideCategory | null;
    currentNode: GuideNode | null;
    width: number;
}
