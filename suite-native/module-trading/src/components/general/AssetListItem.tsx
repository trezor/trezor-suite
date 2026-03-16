import { type ReactNode } from 'react';
import { Pressable } from 'react-native';

import { type NetworkSymbol, type NetworkSymbolExtended } from '@suite-common/wallet-config';
import { type TokenAddress } from '@suite-common/wallet-types';
import { Box, HStack, Text, VStack } from '@suite-native/atoms';
import { CryptoIconWithNetwork } from '@suite-native/icons';
import { NetworkBadge } from '@suite-native/trading-atoms';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles';

import { NetworkSymbolExtendedFormatter } from './NetworkSymbolExtendedFormatter';

export type AssetListItemProps = {
    name: string;
    symbol: NetworkSymbolExtended;
    contractAddress?: TokenAddress;
    networkSymbol: NetworkSymbol;
    onPress: () => void;
    rightContent?: ReactNode;
};

const vStackStyle = prepareNativeStyle(({ spacings }) => ({
    justifyContent: 'center',
    flex: 1,
    gap: 0,
    paddingVertical: spacings.sp12,
}));

const rightContentStyle = prepareNativeStyle(() => ({
    maxWidth: '40%',
    justifyContent: 'center',
}));

export const AssetListItem = ({
    name,
    symbol,
    contractAddress,
    networkSymbol,
    onPress,
    rightContent,
}: AssetListItemProps) => {
    const { applyStyle } = useNativeStyles();

    return (
        <Pressable
            onPress={onPress}
            accessible={true}
            accessibilityRole="button"
            accessibilityLabel={name}
        >
            <HStack alignItems="center" spacing="sp12">
                <Box justifyContent="center">
                    <CryptoIconWithNetwork
                        symbol={networkSymbol}
                        contractAddress={contractAddress}
                    />
                </Box>
                <VStack style={applyStyle(vStackStyle)}>
                    <HStack alignItems="center" justifyContent="space-between">
                        <Text variant="body-md" color="textDefault">
                            {name}
                        </Text>
                    </HStack>
                    <HStack alignItems="center" justifyContent="flex-start">
                        <NetworkSymbolExtendedFormatter symbol={symbol} />
                        <NetworkBadge symbol={networkSymbol} />
                    </HStack>
                </VStack>
                {rightContent && <Box style={applyStyle(rightContentStyle)}>{rightContent}</Box>}
            </HStack>
        </Pressable>
    );
};
