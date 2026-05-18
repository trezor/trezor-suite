import { createContext, useContext } from 'react';

import { throwError } from '@trezor/utils';

import { type SubTabsSize } from './types';

export const SubTabsContext = createContext<{
    activeItemId?: string;
    size: SubTabsSize;
}>({ size: 'medium' });

export const useSubTabsContext = () =>
    useContext(SubTabsContext) ??
    throwError('useSubTabsContext must be used within a SubTabsContext');
