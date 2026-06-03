import { createContext, useContext } from 'react';

import { throwError } from '@trezor/utils';

import { type TronStakeContextValues } from './hooks/useTronStakeFlow';

export const TronStakeContext = createContext<TronStakeContextValues | null>(null);
TronStakeContext.displayName = 'TronStakeContext';

export const useTronStakeContext = () =>
    useContext(TronStakeContext) ?? throwError('TronStakeContext used without Context');
