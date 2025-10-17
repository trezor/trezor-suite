import { createContext, useContext } from 'react';

import { NetworkSymbol, NetworkType } from '@suite-common/wallet-config';
import { FeeInfo, PrecomposedLevels, PrecomposedLevelsCardano } from '@suite-common/wallet-types';
import { FeeLevel } from '@trezor/connect';

export type FeesContextType = {
    networkSymbol: NetworkSymbol;
    networkType: NetworkType;
    selectedFeeLevel: FeeLevel;
    composedLevels?: PrecomposedLevels | PrecomposedLevelsCardano | null;
    feeInfo: FeeInfo;
    changeFeeLevel: (level: FeeLevel['label']) => void;
};

export const FeesContext = createContext<FeesContextType | null>(null);

export const useFeesContext = () => {
    const context = useContext(FeesContext);

    if (!context) {
        throw new Error('useFeesContext must be used within a FeesContext');
    }

    return context;
};
