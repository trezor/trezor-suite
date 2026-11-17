import { useMemo } from 'react';

import { type FeeInfo, type PrecomposedLevels } from '@suite-common/wallet-types';
import { type FeeLevel } from '@trezor/connect';

type UseComposedLevelsPlaceholderParams = {
    feeInfo: FeeInfo;
    selectedFee?: FeeLevel['label'];
    feePerUnit: string;
    maxFeePerGas?: string;
    feeTotalCalculation?: (feeValue: string, label: FeeLevel['label']) => string;
};

export const useComposedLevelsPlaceholder = ({
    feeInfo,
    selectedFee,
    feePerUnit,
    maxFeePerGas,
    feeTotalCalculation,
}: UseComposedLevelsPlaceholderParams) => {
    const composedLevels = useMemo(() => {
        const levels: PrecomposedLevels = {};

        const createComposedTx = (feeValue: string, label: FeeLevel['label']) => ({
            type: 'final' as const,
            totalSpent: '0',
            fee: feeTotalCalculation ? feeTotalCalculation(feeValue, label) : feeValue,
            feePerByte: feeValue,
            bytes: 0,
            inputs: [],
            outputs: [],
            outputsPermutation: [],
        });

        feeInfo.levels.forEach(level => {
            levels[level.label] = createComposedTx(
                level.maxFeePerGas ?? level.feePerUnit,
                level.label,
            );
        });

        if (selectedFee === 'custom' && feePerUnit) {
            levels.custom = createComposedTx(maxFeePerGas ?? feePerUnit, 'custom');
        }

        return levels;
    }, [feeInfo.levels, feePerUnit, maxFeePerGas, selectedFee, feeTotalCalculation]);

    return composedLevels;
};
