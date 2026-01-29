import { useCallback } from 'react';

import { NetworkSymbol } from '@suite-common/wallet-config';
import { GeneralPrecomposedLevels } from '@suite-common/wallet-types';
import { Text, VStack } from '@suite-native/atoms';
import { Translation } from '@suite-native/intl';
import { FeeOptionsList } from '@suite-native/transaction-management';

type FeeOptionsSectionProps = {
    feeLevels: GeneralPrecomposedLevels;
    symbol: NetworkSymbol;
    isLoading: boolean;
};

export const FeeOptionsSection = ({ feeLevels, symbol, isLoading }: FeeOptionsSectionProps) => {
    // Stellar trustline operations always use 'normal' fee - no user selection needed
    const handleSelectedFeeLevel = useCallback(() => {}, []);

    return (
        <VStack spacing="sp16">
            <VStack spacing="sp4">
                <Text variant="titleSmall">
                    <Translation id="transactionManagement.fees.description.title.general" />
                </Text>
                <Text>
                    <Translation id="transactionManagement.fees.description.body" />
                </Text>
            </VStack>
            <FeeOptionsList
                feeLevels={feeLevels}
                symbol={symbol}
                isLoading={isLoading}
                onSelectedFeeLevel={handleSelectedFeeLevel}
            />
        </VStack>
    );
};
