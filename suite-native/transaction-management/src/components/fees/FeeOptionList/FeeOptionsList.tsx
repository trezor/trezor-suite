import { type NetworkSymbol, getNetworkType } from '@suite-common/wallet-config';
import { type GeneralPrecomposedLevels } from '@suite-common/wallet-types';
import { VStack } from '@suite-native/atoms';

import { FeeOption } from './FeeOption';
import {
    getReferenceFeeLevel,
    predefinedFeeLevelOrder,
} from '../../../hooks/fees/referenceFeeLevel';
import { type NativeSupportedPredefinedFeeLevel } from '../../../types';

export type FeeOptionsListProps = {
    feeLevels: GeneralPrecomposedLevels;
    symbol: NetworkSymbol;
    isLoading?: boolean;
    onSelectedFeeLevel?: (feeKey: NativeSupportedPredefinedFeeLevel) => void;
};

export const FeeOptionsList = ({
    feeLevels,
    symbol,
    isLoading,
    onSelectedFeeLevel,
}: FeeOptionsListProps) => {
    const isBtcNetworkType = getNetworkType(symbol) === 'bitcoin';

    const predefinedFeeKeys = predefinedFeeLevelOrder.filter(
        key => feeLevels[key] && !(isBtcNetworkType && key === 'low'),
    );
    const referenceFeeLevel = getReferenceFeeLevel(feeLevels);
    const isMultipleOptionsDisplayed = predefinedFeeKeys.length > 1;

    return (
        <VStack spacing="sp12">
            {predefinedFeeKeys.map(feeKey => {
                const feeLevel = feeLevels[feeKey];
                if (!feeLevel) return null;

                return (
                    <FeeOption
                        key={feeKey}
                        feeKey={feeKey}
                        feeLevel={feeLevel}
                        referenceFeeLevel={referenceFeeLevel}
                        symbol={symbol}
                        isInteractive={isMultipleOptionsDisplayed}
                        isLoading={isLoading}
                        onSelectedFeeLevel={onSelectedFeeLevel}
                    />
                );
            })}
        </VStack>
    );
};
