import { type ReactNode, createContext, useContext } from 'react';

import { type SpacingValues, spacings } from '@trezor/theme';

import { type BulletVerticalAlignment, type ListStyleType } from './types';

type ListContextValue = {
    bulletGap: SpacingValues;
    bulletAlignment: BulletVerticalAlignment;
    bulletComponent: ReactNode;
    listStyleType?: ListStyleType;
};

export const ListContext = createContext<ListContextValue>({
    bulletGap: spacings.md,
    bulletAlignment: 'center',
    bulletComponent: null as ReactNode,
});

export const useList = () => useContext(ListContext);
