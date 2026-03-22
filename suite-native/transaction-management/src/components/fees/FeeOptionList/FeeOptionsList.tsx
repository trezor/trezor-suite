import { D, pipe } from '@mobily/ts-belt';

import { type NetworkSymbol, getNetworkType } from '@suite-common/wallet-config';
import { type GeneralPrecomposedLevels } from '@suite-common/wallet-types';
import { VStack } from '@suite-native/atoms';

import { FeeOption } from './FeeOption';
import { type NativeSupportedPredefinedFeeLevel } from '../../../types';

export type FeeOptionsListProps = {
    feeLevels: GeneralPrecomposedLevels;
    symbol: NetworkSymbol;
    isLoading?: boolean;
    onSelectedFeeLevel?: (feeKey: NativeSupportedPredefinedFeeLevel) => void;
};

// User is not able to enter the fees screen if there is not normal fee or at least the economy fee (in final state) present.
const getTransactionBytes = (feeLevels: Partial<GeneralPrecomposedLevels>) => {
    if (feeLevels.normal && 'bytes' in feeLevels.normal) {
        return feeLevels.normal.bytes;
    }

    if (feeLevels.economy && 'bytes' in feeLevels.economy) {
        return feeLevels.economy.bytes;
    }

    return 0;
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

    const transactionBytes = getTransactionBytes(predefinedFeeLevels);

    const isMultipleOptionsDisplayed = Object.keys(predefinedFeeLevels).length > 1;

    return (
        <VStack spacing="sp12">
            {Object.entries(predefinedFeeLevels).map(([feeKey, feeLevel]) => (
                <FeeOption
                    key={feeKey}
                    feeKey={feeKey as NativeSupportedPredefinedFeeLevel}
                    feeLevel={feeLevel}
                    symbol={symbol}
                    transactionBytes={transactionBytes}
                    isInteractive={isMultipleOptionsDisplayed}
                    isLoading={isLoading}
                    onSelectedFeeLevel={onSelectedFeeLevel}
                />
            ))}
        </VStack>
    );
};
