import { createContext, useContext } from 'react';

import { type useAllowanceTxTracking } from '@suite-common/trading';
import { throwError } from '@trezor/utils';

import { type useAllowanceState } from './useAllowanceState';

export interface AllowanceContextValue {
    tx: ReturnType<typeof useAllowanceTxTracking>;
    state: ReturnType<typeof useAllowanceState>;
}

export const AllowanceContext = createContext<AllowanceContextValue | null>(null);
AllowanceContext.displayName = 'AllowanceContext';

export const useAllowanceContext = () =>
    useContext(AllowanceContext) ??
    throwError('useAllowanceContext must be used within AllowanceContext.Provider');
