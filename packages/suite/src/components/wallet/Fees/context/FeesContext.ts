import { createContext, useContext } from 'react';

import { type NetworkSymbol, type NetworkType } from '@suite-common/wallet-config';
import {
    type FeeInfo,
    type PrecomposedLevels,
    type PrecomposedLevelsCardano,
} from '@suite-common/wallet-types';
import { type FeeLevel } from '@trezor/connect';
import { throwError } from '@trezor/utils';

export type TronResources = {
    availableFreeBandwidth: number;
    totalFreeBandwidth: number;
    availableStakedBandwidth: number;
    totalStakedBandwidth: number;
    availableEnergy: number;
    totalEnergy: number;
};

export type FeesContextType = {
    networkSymbol: NetworkSymbol;
    networkType: NetworkType;
    selectedFeeLevel?: FeeLevel;
    composedLevels?: PrecomposedLevels | PrecomposedLevelsCardano | null;
    feeInfo: FeeInfo;
    changeFeeLevel: (level: FeeLevel['label']) => void;
    tronResources?: TronResources;
};

export const FeesContext = createContext<FeesContextType | null>(null);

export const useFeesContext = () =>
    useContext(FeesContext) ?? throwError('useFeesContext must be used within a FeesContext');
