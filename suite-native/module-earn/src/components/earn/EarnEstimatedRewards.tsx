import { type ReactNode } from 'react';
import { useSelector } from 'react-redux';

import { type NetworkSymbol } from '@suite-common/wallet-config';
import { calculateRewards } from '@suite-common/wallet-core';
import { type AccountKey, type TokenAddress } from '@suite-common/wallet-types';
import { Text, VStack } from '@suite-native/atoms';
import {
    CompactCryptoAmountFormatter,
    CompactTokenAmountFormatter,
    asDecimalTokenAmount,
} from '@suite-native/formatters';
import { type TokensRootState, selectAccountTokenInfo } from '@suite-native/tokens';

type EarnEstimatedRewardsProps = {
    accountKey?: AccountKey;
    amountValue: string;
    apy: number | null;
    label: ReactNode;
    symbol: NetworkSymbol;
    tokenContract?: TokenAddress;
};

export const EarnEstimatedRewards = ({
    accountKey,
    amountValue,
    apy,
    label,
    symbol,
    tokenContract,
}: EarnEstimatedRewardsProps) => {
    const rewards = calculateRewards(amountValue, apy);
    const tokenInfo = useSelector((state: TokensRootState) =>
        selectAccountTokenInfo(state, accountKey, tokenContract),
    );

    return (
        <VStack spacing="sp4" paddingHorizontal="sp16">
            <Text variant="body-sm" color="contentPrimary" textAlign="center">
                {label}
            </Text>
            {tokenContract ? (
                <CompactTokenAmountFormatter
                    value={asDecimalTokenAmount(rewards)}
                    tokenSymbol={tokenInfo?.symbol ?? null}
                    tokenDecimals={tokenInfo?.decimals}
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
