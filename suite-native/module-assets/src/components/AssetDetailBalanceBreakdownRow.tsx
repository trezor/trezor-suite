import { type ReactNode } from 'react';

import { Box, HStack, Text, VStack } from '@suite-native/atoms';
import { CryptoToFiatAmountFormatter, ExactCryptoAmountFormatter } from '@suite-native/formatters';

import { useAssetDetailRouteParams } from '../hooks/useAssetDetailRouteParams';

type AssetDetailBalanceBreakdownRowProps = {
    balance: string;
    label: ReactNode;
};

export const AssetDetailBalanceBreakdownRow = ({
    balance,
    label,
}: AssetDetailBalanceBreakdownRowProps) => {
    const { networkSymbol } = useAssetDetailRouteParams();

    return (
        <HStack alignItems="center" justifyContent="space-between" spacing="sp12">
            <Box flex={1}>
                <Text variant="body-md" numberOfLines={1}>
                    {label}
                </Text>
            </Box>
            <VStack alignItems="flex-end" spacing={0} flex={1}>
                <CryptoToFiatAmountFormatter
                    symbol={networkSymbol}
                    value={balance}
                    isBalance
                    variant="body-md-strong"
                    numberOfLines={1}
                    adjustsFontSizeToFit
                />
                <ExactCryptoAmountFormatter
                    symbol={networkSymbol}
                    value={balance}
                    variant="body-sm"
                    color="contentSecondary"
                    numberOfLines={1}
                    adjustsFontSizeToFit
                />
            </VStack>
        </HStack>
    );
};
