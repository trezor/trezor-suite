import { D, pipe } from '@mobily/ts-belt';

import { type NetworkSymbol, getNetworkType } from '@suite-common/wallet-config';
import { type GeneralPrecomposedLevels } from '@suite-common/wallet-types';
import { VStack } from '@suite-native/atoms';

import { FeeOption } from './FeeOption';
import { getReferenceFeeLevel } from '../../../hooks/fees/referenceFeeLevel';
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

    const predefinedFeeLevels = pipe(
        feeLevels,
        D.filterWithKey(key => key !== 'custom' && (isBtcNetworkType ? key !== 'low' : true)),
    );
    const referenceFeeLevel = getReferenceFeeLevel(feeLevels);
    const isMultipleOptionsDisplayed = Object.keys(predefinedFeeLevels).length > 1;

    return (
        <VStack spacing="sp12">
            {Object.entries(predefinedFeeLevels).map(([feeKey, feeLevel]) => (
                <FeeOption
                    key={feeKey}
                    feeKey={feeKey as NativeSupportedPredefinedFeeLevel}
                    feeLevel={feeLevel}
                    referenceFeeLevel={referenceFeeLevel}
                    symbol={symbol}
                    isInteractive={isMultipleOptionsDisplayed}
                    isLoading={isLoading}
                    onSelectedFeeLevel={onSelectedFeeLevel}
                />
            ))}
        </VStack>
    );
};
