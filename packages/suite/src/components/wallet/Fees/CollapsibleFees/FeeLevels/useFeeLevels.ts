import { useMemo } from 'react';

import { type FeesContextType } from '../../context/FeesContext';
import { getIsTrc20Transfer, getSupportsAdjustableFees } from '../../feeUtils';
import { useTransactionMaxFee } from '../hooks/useTransactionMaxFee';

export const useFeeLevels = ({
    networkType,
    networkSymbol,
    feeInfo,
    composedLevels,
    selectedFee,
    selectedFeeLevel,
}: FeesContextType) => {
    const isTrc20Transfer = useMemo(
        () => getIsTrc20Transfer({ networkType, composedLevels }),
        [networkType, composedLevels],
    );

    const supportsAdjustableFees = getSupportsAdjustableFees({
        networkType,
        isTokenTransfer: isTrc20Transfer,
    });

    // get default non-custom fee level, preferably normal
    const defaultFeeLevel = useMemo(
        () =>
            feeInfo.levels.find(level => level.label === 'normal')?.label ??
            feeInfo.levels.find(level => level.label !== 'custom')?.label,
        [feeInfo.levels],
    );

    const txMaxFee = useTransactionMaxFee({ networkSymbol, composedLevels, selectedFeeLevel });

    return {
        isTrc20Transfer,
        supportsAdjustableFees,
        isCustomFee: supportsAdjustableFees && selectedFee === 'custom',
        defaultFeeLevel,
        txMaxFee,
    };
};
