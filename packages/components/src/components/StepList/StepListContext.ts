import { createContext, useContext } from 'react';

import { type SpacingValuesNew } from '@trezor/theme';

import { type BulletSize, type StepLineWidth, type StepListDirection } from './types';

type StepListContextValue = {
    itemGap: SpacingValuesNew;
    titleGap: SpacingValuesNew;
    bulletGap: SpacingValuesNew;
    bulletSize: BulletSize;
    lineWidth: StepLineWidth;
    isOrdered: boolean;
    direction: StepListDirection;
};

export const StepListContext = createContext<StepListContextValue>({
    itemGap: 32,
    titleGap: 8,
    bulletGap: 24,
    bulletSize: 'large',
    isOrdered: false,
    lineWidth: 2,
    direction: 'vertical',
});

export const useStepList = () => useContext(StepListContext);
