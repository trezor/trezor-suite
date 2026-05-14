import { useMemo } from 'react';

import { type FeeInfo, type PrecomposedLevels } from '@suite-common/wallet-types';
import { type FeeLevel } from '@trezor/connect';

export const useComposedLevelsPlaceholder = ({
    feeInfo,
    selectedFee,
    feePerUnit,
    maxFeePerGas,
    feeTotalCalculation,
}: {
    feeInfo: FeeInfo;
    selectedFee?: FeeLevel['label'];
    feePerUnit: string;
    maxFeePerGas?: string;
    feeTotalCalculation?: (feeValue: string) => string;
}) => {
    const composedLevels = useMemo(() => {
        const levels: PrecomposedLevels = {};

        const createComposedTx = (feeValue: string) => ({
            type: 'final' as const,
            totalSpent: '0',
            fee: feeTotalCalculation ? feeTotalCalculation(feeValue) : feeValue,
            feePerByte: feeValue,
            bytes: 0,
            inputs: [],
            outputs: [],
            outputsPermutation: [],
        });

        feeInfo.levels.forEach(level => {
            levels[level.label] = createComposedTx(level.maxFeePerGas ?? level.feePerUnit);
        });

        if (selectedFee === 'custom' && feePerUnit) {
            levels.custom = createComposedTx(maxFeePerGas ?? feePerUnit);
        }

        return levels;
    }, [feeInfo.levels, feePerUnit, maxFeePerGas, selectedFee, feeTotalCalculation]);

    return composedLevels;
};
