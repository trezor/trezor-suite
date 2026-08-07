import { type ReactNode } from 'react';
import { type PressableProps } from 'react-native';
import {
    interpolateColor,
    useAnimatedStyle,
    useSharedValue,
    withTiming,
} from 'react-native-reanimated';

import { type NetworkSymbol, type NetworkSymbolExtended } from '@suite-common/wallet-config';
import { type TokenAddress } from '@suite-common/wallet-types';
import { AnimatedPressable, Box, HStack, Text, VStack } from '@suite-native/atoms';
import { TokenIcon } from '@suite-native/icons';
import { NetworkBadge } from '@suite-native/trading-atoms';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles-native';

import { NetworkSymbolExtendedFormatter } from './NetworkSymbolExtendedFormatter';

export type AssetListItemProps = {
    name: string;
    symbol: NetworkSymbolExtended;
    contractAddress?: TokenAddress;
    networkSymbol: NetworkSymbol;
    onPress: () => void;
    rightContent?: ReactNode;
};

const ANIMATION_DURATION_MS = 100;

const AssetAnimatedPressable = ({ onPress, style, children, ...rest }: PressableProps) => {
    const { utils } = useNativeStyles();
    const progress = useSharedValue(0);
    const handlePressIn = () =>
        (progress.value = withTiming(1, { duration: ANIMATION_DURATION_MS }));
    const handlePressOut = () =>
        (progress.value = withTiming(0, { duration: ANIMATION_DURATION_MS }));

    const animatedStyle = useAnimatedStyle(() => ({
        backgroundColor: interpolateColor(
            progress.value,
            [0, 1],
            ['transparent', utils.colors.elementFillGhostPressed],
        ),
    }));

    return (
        <AnimatedPressable
            onPress={onPress}
            onPressIn={handlePressIn}
            onPressOut={handlePressOut}
            style={[animatedStyle, style]}
            {...rest}
        >
            {children}
        </AnimatedPressable>
    );
};

const vStackStyle = prepareNativeStyle(() => ({
    justifyContent: 'center',
    flex: 1,
    gap: 0,
}));

const rightContentStyle = prepareNativeStyle(() => ({
    maxWidth: '50%',
    justifyContent: 'center',
}));

const containerStyle = prepareNativeStyle(({ borders }) => ({
    borderRadius: borders.radii.r12,
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
        <AssetAnimatedPressable
            onPress={onPress}
            accessible={true}
            accessibilityRole="button"
            accessibilityLabel={name}
            style={applyStyle(containerStyle)}
        >
            <HStack
                alignItems="center"
                spacing="sp8"
                paddingHorizontal="sp8"
                paddingVertical="sp12"
            >
                <TokenIcon
                    symbol={networkSymbol}
                    contractAddress={contractAddress}
                    showNetworkIcon
                    size="medium"
                />
                <VStack style={applyStyle(vStackStyle)}>
                    <Text variant="body-md" color="contentPrimary">
                        {name}
                    </Text>
                    <HStack spacing="sp4" alignItems="center" justifyContent="flex-start">
                        <NetworkSymbolExtendedFormatter symbol={symbol} />
                        <NetworkBadge symbol={networkSymbol} />
                    </HStack>
                </VStack>
                {rightContent && <Box style={applyStyle(rightContentStyle)}>{rightContent}</Box>}
            </HStack>
        </AssetAnimatedPressable>
    );
};
