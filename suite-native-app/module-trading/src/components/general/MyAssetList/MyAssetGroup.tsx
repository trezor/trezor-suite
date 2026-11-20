import { type ReactNode, useState } from 'react';
import {
    useAnimatedStyle,
    useDerivedValue,
    useSharedValue,
    withTiming,
} from 'react-native-reanimated';

import { AnimatedBox, Box, HStack, PressableOpacity, Text, VStack } from '@suite-native/atoms';
import { Icon } from '@suite-native/icons';
import { type MyAsset } from '@suite-native/trading-types';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles-native';

import { MyAssetListItem } from './MyAssetListItem';
import { TokenIconGroup } from './TokenIconGroup';

export type MyAssetGroupProps = {
    assets: MyAsset[];
    isFirst?: boolean;
    isLast?: boolean;
    onAssetSelect: (asset: MyAsset) => void;
    testID?: string;
    title: string | ReactNode;
};

const ANIMATION_DURATION = 200;

const containerStyle = prepareNativeStyle<{ isFirst: boolean; isLast: boolean }>(
    ({ borders, colors }, { isFirst, isLast }) => ({
        borderColor: colors.borderNeutral,
        borderWidth: borders.widths.small,
        borderTopWidth: isFirst ? borders.widths.small : 0,
        borderTopLeftRadius: isFirst ? borders.radii.r16 : 0,
        borderTopRightRadius: isFirst ? borders.radii.r16 : 0,
        borderBottomLeftRadius: isLast ? borders.radii.r16 : 0,
        borderBottomRightRadius: isLast ? borders.radii.r16 : 0,
        overflow: 'hidden',
    }),
);

const contentWrapperStyle = prepareNativeStyle(() => ({
    position: 'absolute',
    width: '100%',
}));

export const MyAssetGroup = ({
    assets,
    isFirst = true,
    isLast = true,
    onAssetSelect,
    testID,
    title,
}: MyAssetGroupProps) => {
    const { applyStyle } = useNativeStyles();
    const [isExpanded, setIsExpanded] = useState(false);
    const expansion = useSharedValue(false);
    const contentHeight = useSharedValue(0);

    const toggleExpansion = () => {
        const nextIsExpanded = !isExpanded;

        setIsExpanded(nextIsExpanded);
        expansion.value = nextIsExpanded;
    };

    const derivedContentHeight = useDerivedValue(() =>
        withTiming(contentHeight.value * Number(expansion.value), {
            duration: ANIMATION_DURATION,
        }),
    );

    const contentHeightStyle = useAnimatedStyle(() => ({
        height: derivedContentHeight.value,
        overflow: 'hidden',
    }));

    return (
        <Box style={applyStyle(containerStyle, { isFirst, isLast })} testID={testID}>
            <PressableOpacity
                accessibilityRole="button"
                accessibilityState={{ expanded: isExpanded }}
                onPress={toggleExpansion}
                testID={testID ? `${testID}/toggle` : undefined}
            >
                <HStack
                    alignItems="center"
                    justifyContent="space-between"
                    paddingHorizontal="sp16"
                    paddingVertical="sp16"
                >
                    <Text variant="body-md">{title}</Text>
                    <HStack alignItems="center" spacing="sp8">
                        {!isExpanded && (
                            <TokenIconGroup
                                assets={assets}
                                testID={testID ? `${testID}/preview` : undefined}
                            />
                        )}
                        <Icon
                            name={isExpanded ? 'caretUpDownReverse' : 'caretUpDown'}
                            size="small"
                        />
                    </HStack>
                </HStack>
            </PressableOpacity>
            <AnimatedBox
                accessibilityElementsHidden={!isExpanded}
                importantForAccessibility={isExpanded ? 'auto' : 'no-hide-descendants'}
                pointerEvents={isExpanded ? 'auto' : 'none'}
                style={contentHeightStyle}
                testID={testID ? `${testID}/content` : undefined}
            >
                <VStack
                    onLayout={event => {
                        contentHeight.value = event.nativeEvent.layout.height;
                    }}
                    paddingHorizontal="sp8"
                    paddingBottom="sp12"
                    style={applyStyle(contentWrapperStyle)}
                    testID={testID ? `${testID}/content-wrapper` : undefined}
                >
                    {assets.map(asset => (
                        <MyAssetListItem
                            key={`${asset.symbol}_${asset.contract ?? asset.cryptoId}`}
                            asset={asset}
                            onPress={() => onAssetSelect(asset)}
                        />
                    ))}
                </VStack>
            </AnimatedBox>
        </Box>
    );
};
