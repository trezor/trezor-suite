import { type ReactNode } from 'react';

import { type TokenAddress } from '@suite-common/tokens';
import { type NetworkSymbol } from '@suite-common/wallet-config';
import { calculateRewards } from '@suite-common/wallet-core';
import { type AccountKey } from '@suite-common/wallet-types';
import { Text, VStack } from '@suite-native/atoms';
import {
    CompactCryptoAmountFormatter,
    CompactTokenAmountFormatter,
    asDecimalTokenAmount,
} from '@suite-native/formatters';

type EarnEstimatedRewardsProps = {
    accountKey?: AccountKey;
    amountValue: string;
    apy: number | null;
    label: ReactNode;
    symbol: NetworkSymbol;
    tokenContract?: TokenAddress;
};

export const EarnEstimatedRewards = ({
    amountValue,
    apy,
    label,
    symbol,
    tokenContract,
}: EarnEstimatedRewardsProps) => {
    const rewards = calculateRewards(amountValue, apy);

    return (
        <VStack spacing="sp4" paddingHorizontal="sp16">
            <Text variant="body-sm" color="contentPrimary" textAlign="center">
                {label}
            </Text>
            {tokenContract ? (
                <CompactTokenAmountFormatter
                    networkSymbol={symbol}
                    contractAddress={tokenContract}
                    value={asDecimalTokenAmount(rewards)}
                    numberOfLines={1}
                    adjustsFontSizeToFit
                    variant="headline-sm"
                    color="contentBrand"
                    textAlign="center"
                />
            ) : (
                <CompactCryptoAmountFormatter
                    value={rewards}
                    symbol={symbol}
                    numberOfLines={1}
                    adjustsFontSizeToFit
                    variant="headline-sm"
                    color="contentBrand"
                    textAlign="center"
                />
            )}
        </VStack>
    );
};
