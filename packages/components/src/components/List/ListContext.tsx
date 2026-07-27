import { type ReactNode, createContext, useContext } from 'react';

import { type SpacingValue } from '@trezor/theme';

import { type BulletVerticalAlignment, type ListStyleType } from './types';

type ListContextValue = {
    bulletGap: SpacingValue;
    bulletAlignment: BulletVerticalAlignment;
    bulletComponent: ReactNode;
    listStyleType?: ListStyleType;
};

export const ListContext = createContext<ListContextValue>({
    bulletGap: 16,
    bulletAlignment: 'center',
    bulletComponent: null as ReactNode,
});

export const useList = () => useContext(ListContext);
