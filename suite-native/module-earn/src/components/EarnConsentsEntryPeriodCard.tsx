import { useState } from 'react';
import { type LayoutChangeEvent, Linking } from 'react-native';
import Animated, {
    Easing,
    useAnimatedStyle,
    useSharedValue,
    withTiming,
} from 'react-native-reanimated';

import { Button, Card, HStack, Text, VStack } from '@suite-native/atoms';
import { Icon } from '@suite-native/icons';
import { Translation } from '@suite-native/intl';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles-native';
import { type Url } from '@trezor/urls';

import { EarnConsentsItem } from './EarnConsentsItem';

const COLLAPSE_DURATION = 400;

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

const learnMoreButtonStyle = prepareNativeStyle(() => ({ flex: 3 }));
const confirmButtonStyle = prepareNativeStyle(() => ({ flex: 7 }));

export const EarnConsentsEntryPeriodCard = ({
    onConfirm,
    entryPeriodInDays,
    learnMoreUrl,
}: {
    onConfirm?: () => void;
    entryPeriodInDays?: number;
    learnMoreUrl?: Url;
}) => {
    const { applyStyle } = useNativeStyles();
    const [isConfirmed, setIsConfirmed] = useState(false);
    const collapsibleHeight = useSharedValue(-1);

    const handleLearnMore = () => {
        if (learnMoreUrl) Linking.openURL(learnMoreUrl);
    };

    const handleLayout = (event: LayoutChangeEvent) => {
        if (collapsibleHeight.value === -1) {
            collapsibleHeight.value = event.nativeEvent.layout.height;
        }
    };

    const handleConfirm = () => {
        collapsibleHeight.value = withTiming(0, {
            duration: COLLAPSE_DURATION,
            easing: Easing.inOut(Easing.cubic),
        });
        setIsConfirmed(true);
        onConfirm?.();
    };

    const collapsibleStyle = useAnimatedStyle(() => {
        if (collapsibleHeight.value === -1) return { overflow: 'hidden' };

        return {
            height: collapsibleHeight.value,
            overflow: 'hidden',
        };
    });

    return (
        <Card noPadding>
            <HStack spacing="sp8" alignItems="center" style={applyStyle(headerSectionStyle)}>
                <Icon
                    name={isConfirmed ? 'check' : 'calendarBlank'}
                    size="mediumLarge"
                    color={isConfirmed ? 'iconPrimaryDefault' : 'iconSubdued'}
                />
                <Text variant="body-sm" color={isConfirmed ? 'textPrimaryDefault' : 'textSubdued'}>
                    <Translation id="earn.earnConsentsScreen.entryPeriodCard.title" />
                </Text>
            </HStack>
            <Animated.View onLayout={handleLayout} style={collapsibleStyle}>
                <VStack spacing="sp16" style={applyStyle(itemsSectionStyle)}>
                    <EarnConsentsItem iconName="calendarBlank" color="textDefault">
                        <Translation
                            id="earn.earnConsentsScreen.entryPeriodCard.firstItem"
                            values={{
                                entryPeriodInDays: entryPeriodInDays ? (
                                    entryPeriodInDays
                                ) : (
                                    <Translation id="earn.notAvailableShort" />
                                ),
                            }}
                        />
                    </EarnConsentsItem>
                    <EarnConsentsItem iconName="info" color="textDefault">
                        <Translation id="earn.earnConsentsScreen.entryPeriodCard.secondItem" />
                    </EarnConsentsItem>
                </VStack>
                <HStack style={applyStyle(buttonsRowStyle)}>
                    {learnMoreUrl && (
                        <Button
                            intent="info"
                            priority="secondary"
                            size="medium"
                            onPress={handleLearnMore}
                            style={applyStyle(learnMoreButtonStyle)}
                        >
                            <Translation id="generic.buttons.learnMore" />
                        </Button>
                    )}
                    <Button
                        intent="info"
                        size="medium"
                        onPress={handleConfirm}
                        style={applyStyle(confirmButtonStyle)}
                    >
                        <Translation id="generic.buttons.understand" />
                    </Button>
                </HStack>
            </Animated.View>
        </Card>
    );
};
