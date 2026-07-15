import { createContext, useContext } from 'react';

import { type NetworkSymbol, type NetworkType } from '@suite-common/wallet-config';
import {
    type FeeInfo,
    type PrecomposedLevels,
    type PrecomposedLevelsCardano,
} from '@suite-common/wallet-types';
import { type TronAccountExtraData } from '@trezor/blockchain-link-types';
import { type FeeLevel } from '@trezor/connect';
import { throwError } from '@trezor/utils';

export type FeesContextType = {
    networkSymbol: NetworkSymbol;
    networkType: NetworkType;
    selectedFeeLevel?: FeeLevel;
    composedLevels?: PrecomposedLevels | PrecomposedLevelsCardano | null;
    feeInfo: FeeInfo;
    changeFeeLevel: (level: FeeLevel['label']) => void;
    tronResources?: TronAccountExtraData;
};

export const FeesContext = createContext<FeesContextType | null>(null);

export const useFeesContext = () =>
    useContext(FeesContext) ?? throwError('useFeesContext must be used within a FeesContext');
