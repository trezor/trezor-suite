import Animated, { FadeInLeft, FadeOutLeft } from 'react-native-reanimated';

import { D, pipe } from '@mobily/ts-belt';

import { type NetworkSymbol } from '@suite-common/wallet-config';
import { AccountKey, GeneralPrecomposedLevels, TokenAddress } from '@suite-common/wallet-types';
import { VStack } from '@suite-native/atoms';

import { FeeOption } from './FeeOption';
import { NativeSupportedFeeLevel } from '../types';

type FeeOptionsListProps = {
    feeLevels: GeneralPrecomposedLevels;
    symbol: NetworkSymbol;
    accountKey: AccountKey;
    tokenContract?: TokenAddress;
    isLoading?: boolean;
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
    accountKey,
    tokenContract,
    isLoading = false,
}: FeeOptionsListProps) => {
    const predefinedFeeLevels = pipe(
        feeLevels,
        D.filterWithKey(key => key !== 'custom'),
    );

    const transactionBytes = getTransactionBytes(predefinedFeeLevels);

    const isMultipleOptionsDisplayed = Object.keys(predefinedFeeLevels).length > 1;

    return (
        <Animated.View entering={FadeInLeft.delay(300)} exiting={FadeOutLeft}>
            <VStack spacing="sp12">
                {Object.entries(predefinedFeeLevels).map(([feeKey, feeLevel]) => (
                    <FeeOption
                        key={feeKey}
                        feeKey={feeKey as Exclude<NativeSupportedFeeLevel, 'custom'>}
                        feeLevel={feeLevel}
                        accountKey={accountKey}
                        tokenContract={tokenContract}
                        symbol={symbol}
                        transactionBytes={transactionBytes}
                        isInteractive={isMultipleOptionsDisplayed}
                        isLoading={isLoading}
                    />
                ))}
            </VStack>
        </Animated.View>
    );
};
