import type { ReactNode } from 'react';
import { createContext, useContext } from 'react';

import type { SpacingValues } from '@trezor/theme';
import { spacings } from '@trezor/theme';

import type { BulletVerticalAlignment, ListStyleType } from './types';

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
