import { createContext, useContext } from 'react';

import { type SpacingValuesNew } from '@trezor/theme';

import { type BulletLineWidth, type BulletListDirection, type BulletSize } from './types';

type BulletListContextValue = {
    itemGap: SpacingValuesNew;
    titleGap: SpacingValuesNew;
    bulletGap: SpacingValuesNew;
    bulletSize: BulletSize;
    lineWidth: BulletLineWidth;
    isOrdered: boolean;
    direction: BulletListDirection;
};

export const BulletListContext = createContext<BulletListContextValue>({
    itemGap: 32,
    titleGap: 8,
    bulletGap: 24,
    bulletSize: 'large',
    isOrdered: false,
    lineWidth: 2,
    direction: 'vertical',
});

export const useBulletList = () => useContext(BulletListContext);
