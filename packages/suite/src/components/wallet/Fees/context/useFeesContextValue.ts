import { useMemo } from 'react';
import { type Control, useWatch } from 'react-hook-form';

import { type FormState } from '@suite-common/wallet-types';

import { type Account } from 'src/types/wallet';

import { type FeesContextType } from './FeesContext';

export type UseFeesContextValueParams = {
    account: Pick<Account, 'symbol' | 'networkType' | 'misc'>;
    control: Control<FormState>;
} & Pick<FeesContextType, 'feeInfo' | 'composedLevels' | 'changeFeeLevel' | 'isComposing'>;

export const useFeesContextValue = ({
    account: { symbol: networkSymbol, networkType, misc },
    control,
    feeInfo,
    composedLevels,
    changeFeeLevel,
    isComposing,
}: UseFeesContextValueParams): FeesContextType => {
    const selectedFee =
        useWatch<FormState, 'selectedFee'>({ name: 'selectedFee', control }) ?? 'normal';

    const selectedFeeLevel = useMemo(
        () => feeInfo.levels.find(({ label }) => label === selectedFee),
        [feeInfo.levels, selectedFee],
    );

    return {
        networkSymbol,
        networkType,
        feeInfo,
        composedLevels,
        changeFeeLevel,
        selectedFee,
        selectedFeeLevel,
        tronResources: misc && 'tronResources' in misc ? misc.tronResources : undefined,
        isComposing,
    };
};
