import { type ReactNode } from 'react';

import { BASE_CRYPTO_MAX_DISPLAYED_DECIMALS } from '@suite-common/formatters';
import { selectAccountNetworkSymbol, useAccountsSelector } from '@suite-common/wallet-core';
import { type AccountKey } from '@suite-common/wallet-types';
import { Card, HStack, PressableOpacity, Text, VStack } from '@suite-native/atoms';
import { CryptoAmountFormatter, CryptoToFiatAmountFormatter } from '@suite-native/formatters';
import { Icon } from '@suite-native/icons';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles-native';

type StakingManagementPendingItemProps = {
    accountKey: AccountKey;
    label: ReactNode;
    amount: string;
    onPress: () => void;
};

const rowStyle = prepareNativeStyle(() => ({
    alignItems: 'center',
}));

const amountsStyle = prepareNativeStyle(() => ({
    alignItems: 'flex-end',
}));

const labelStyle = prepareNativeStyle(() => ({
    flex: 1,
}));

export const StakingManagementPendingItem = ({
    accountKey,
    label,
    amount,
    onPress,
}: StakingManagementPendingItemProps) => {
    const { applyStyle } = useNativeStyles();
    const symbol = useAccountsSelector(state => selectAccountNetworkSymbol(state, accountKey));

    if (!symbol || parseFloat(amount) === 0) return null;

    return (
        <PressableOpacity onPress={onPress}>
            <Card>
                <HStack style={applyStyle(rowStyle)}>
                    <Text variant="body-sm-strong" style={applyStyle(labelStyle)}>
                        {label}
                    </Text>
                    {!!symbol && (
                        <HStack spacing="sp12" alignItems="center">
                            <VStack style={applyStyle(amountsStyle)} spacing="sp2">
                                <CryptoAmountFormatter
                                    value={amount}
                                    symbol={symbol}
                                    decimals={BASE_CRYPTO_MAX_DISPLAYED_DECIMALS}
                                    color="textDefault"
                                    variant="body-md-strong"
                                />
                                <CryptoToFiatAmountFormatter
                                    value={amount}
                                    symbol={symbol}
                                    color="textSubdued"
                                    variant="body-sm"
                                    isBalance
                                />
                            </VStack>
                            <Icon name="caretDown" size="mediumLarge" color="iconSubdued" />
                        </HStack>
                    )}
                </HStack>
            </Card>
        </PressableOpacity>
    );
};
