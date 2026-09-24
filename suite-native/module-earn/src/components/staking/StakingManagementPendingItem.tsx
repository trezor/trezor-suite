import { type ReactNode } from 'react';

import { selectAccountNetworkSymbol, useAccountsSelector } from '@suite-common/wallet-core';
import { type AccountKey } from '@suite-common/wallet-types';
import { isPositiveBalance } from '@suite-common/wallet-utils';
import { Box, Card, HStack, PressableOpacity, Text, VStack } from '@suite-native/atoms';
import {
    CompactCryptoAmountFormatter,
    CryptoToFiatAmountFormatter,
} from '@suite-native/formatters';
import { Icon } from '@suite-native/icons';

type StakingManagementPendingItemProps = {
    accountKey: AccountKey;
    label: ReactNode;
    amount: string;
    onPress?: () => void;
};

export const StakingManagementPendingItem = ({
    accountKey,
    label,
    amount,
    onPress,
}: StakingManagementPendingItemProps) => {
    const symbol = useAccountsSelector(state => selectAccountNetworkSymbol(state, accountKey));

    if (!symbol || !isPositiveBalance(amount)) return null;

    return (
        <PressableOpacity onPress={onPress} disabled={!onPress}>
            <Card noPadding>
                <HStack alignItems="center" paddingHorizontal="sp16" paddingVertical="sp12">
                    <Box flex={1}>
                        <Text variant="body-sm-strong">{label}</Text>
                    </Box>
                    <HStack spacing="sp12" alignItems="center">
                        <VStack alignItems="flex-end" spacing="sp2">
                            <CompactCryptoAmountFormatter
                                value={amount}
                                symbol={symbol}
                                color="contentPrimary"
                                variant="body-sm"
                            />
                            <CryptoToFiatAmountFormatter
                                value={amount}
                                symbol={symbol}
                                color="contentSecondary"
                                variant="body-sm"
                                isBalance
                            />
                        </VStack>
                        {onPress && (
                            <Icon name="caretDown" size="mediumLarge" color="contentPrimary" />
                        )}
                    </HStack>
                </HStack>
            </Card>
        </PressableOpacity>
    );
};
