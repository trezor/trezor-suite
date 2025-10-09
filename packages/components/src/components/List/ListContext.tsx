import { ReactNode, createContext, useContext } from 'react';

import { SpacingValues, spacings } from '@trezor/theme';

import { BulletVerticalAlignment, ListStyleType } from './types';

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
