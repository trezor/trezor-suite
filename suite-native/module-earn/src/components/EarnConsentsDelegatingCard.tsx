import { useEffect } from 'react';
import { type LayoutChangeEvent } from 'react-native';
import Animated, {
    Easing,
    useAnimatedStyle,
    useSharedValue,
    withTiming,
} from 'react-native-reanimated';

import { type NetworkSymbol, getNetworkDisplaySymbol } from '@suite-common/wallet-config';
import { Button, Card, HStack, Text, VStack } from '@suite-native/atoms';
import { Icon } from '@suite-native/icons';
import { Translation } from '@suite-native/intl';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles-native';

import { EarnConsentsItem } from './EarnConsentsItem';

const EXPAND_DURATION = 400;

const headerSectionStyle = prepareNativeStyle(utils => ({
    paddingVertical: utils.spacings.sp12,
    paddingHorizontal: utils.spacings.sp16,
    borderBottomWidth: utils.borders.widths.small,
    borderBottomColor: utils.colors.borderElevation1,
}));

const itemsSectionStyle = prepareNativeStyle(utils => ({
    padding: utils.spacings.sp16,
    paddingBottom: utils.spacings.sp24,
}));

const buttonsRowStyle = prepareNativeStyle(utils => ({
    paddingHorizontal: utils.spacings.sp16,
    paddingBottom: utils.spacings.sp16,
    gap: utils.spacings.sp12,
}));

const confirmButtonStyle = prepareNativeStyle(() => ({ flex: 1 }));

type EarnConsentsDelegatingCardProps = {
    isExpanded: boolean;
    symbol?: NetworkSymbol;
    onConfirm: () => void;
};

export const EarnConsentsDelegatingCard = ({
    isExpanded,
    symbol,
    onConfirm,
}: EarnConsentsDelegatingCardProps) => {
    const { applyStyle } = useNativeStyles();
    const measuredHeight = useSharedValue(-1);
    const expandableHeight = useSharedValue(0);
    const displaySymbol = symbol ? getNetworkDisplaySymbol(symbol) : undefined;

    const handleLayout = (event: LayoutChangeEvent) => {
        if (measuredHeight.value === -1) {
            measuredHeight.value = event.nativeEvent.layout.height;

            if (isExpanded) {
                expandableHeight.value = withTiming(measuredHeight.value, {
                    duration: EXPAND_DURATION,
                    easing: Easing.inOut(Easing.cubic),
                });
            } else {
                expandableHeight.value = 0;
            }
        }
    };

    useEffect(() => {
        if (isExpanded && measuredHeight.value !== -1) {
            expandableHeight.value = withTiming(measuredHeight.value, {
                duration: EXPAND_DURATION,
                easing: Easing.inOut(Easing.cubic),
            });
        }
    }, [isExpanded, expandableHeight, measuredHeight]);

    const expandableStyle = useAnimatedStyle(() => {
        if (measuredHeight.value === -1) {
            return { overflow: 'hidden', opacity: 0 };
        }

        return {
            height: expandableHeight.value,
            overflow: 'hidden',
            opacity: 1,
        };
    });

    return (
        <Card noPadding>
            <HStack spacing="sp8" alignItems="center" style={applyStyle(headerSectionStyle)}>
                <Icon name="arrowBendRightUp" size="mediumLarge" color="iconSubdued" />
                <Text variant="body-sm" color="textSubdued">
                    <Translation id="earn.earnConsentsScreen.delegatingCard.title" />
                </Text>
            </HStack>
            <Animated.View onLayout={handleLayout} style={expandableStyle}>
                <VStack spacing="sp16" style={applyStyle(itemsSectionStyle)}>
                    <EarnConsentsItem iconName="everstakeLogo" color="textDefault">
                        <Translation
                            id="earn.earnConsentsScreen.delegatingCard.firstItem"
                            values={{
                                displaySymbol: displaySymbol ?? (
                                    <Translation id="earn.notAvailableShort" />
                                ),
                            }}
                        />
                    </EarnConsentsItem>
                    <EarnConsentsItem iconName="lock" color="textDefault">
                        <Translation id="earn.earnConsentsScreen.delegatingCard.secondItem" />
                    </EarnConsentsItem>
                </VStack>
                <HStack style={applyStyle(buttonsRowStyle)}>
                    <Button
                        intent="info"
                        onPress={onConfirm}
                        style={applyStyle(confirmButtonStyle)}
                    >
                        <Translation id="generic.buttons.understand" />
                    </Button>
                </HStack>
            </Animated.View>
        </Card>
    );
};
