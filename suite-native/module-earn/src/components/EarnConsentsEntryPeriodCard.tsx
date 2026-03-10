import { useState } from 'react';
import { LayoutChangeEvent, Linking } from 'react-native';
import Animated, {
    Easing,
    runOnJS,
    useAnimatedStyle,
    useSharedValue,
    withTiming,
} from 'react-native-reanimated';

import { Button, Card, HStack, OrderedListIcon, Text, VStack } from '@suite-native/atoms';
import { Icon } from '@suite-native/icons';
import { Translation } from '@suite-native/intl';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles';

const LEARN_MORE_URL =
    'https://trezor.io/guides/sending-receiving-staking-funds/staking-assets-in-trezor-suite/staking-ethereum-eth-in-trezor-suite';

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

export const EarnConsentsEntryPeriodCard = ({ onConfirm }: { onConfirm?: () => void }) => {
    const { applyStyle } = useNativeStyles();
    const [isConfirmed, setIsConfirmed] = useState(false);
    const collapsibleHeight = useSharedValue(-1);
    const iconTrigger = useSharedValue(0);

    const handleLearnMore = () => {
        Linking.openURL(LEARN_MORE_URL);
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
        iconTrigger.value = withTiming(1, { duration: 100 }, () => {
            runOnJS(setIsConfirmed)(true);
            if (onConfirm) runOnJS(onConfirm)();
        });
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
                    <HStack spacing="sp12" alignItems="center">
                        <OrderedListIcon
                            iconName="calendarBlank"
                            iconSize="large"
                            iconColor="iconAlertBlue"
                            iconBackgroundColor="backgroundAlertBlueSubtleOnElevation1"
                            iconBorderColor="backgroundAlertBlueSubtleOnElevation0"
                        />
                        <Text variant="body-sm-strong" color="textSubdued" style={{ flex: 1 }}>
                            <Translation id="earn.earnConsentsScreen.entryPeriodCard.firstItem" />
                        </Text>
                    </HStack>
                    <HStack spacing="sp12" alignItems="center">
                        <OrderedListIcon
                            iconName="info"
                            iconSize="large"
                            iconColor="iconAlertBlue"
                            iconBackgroundColor="backgroundAlertBlueSubtleOnElevation1"
                            iconBorderColor="backgroundAlertBlueSubtleOnElevation0"
                        />
                        <Text variant="body-sm-strong" color="textSubdued" style={{ flex: 1 }}>
                            <Translation id="earn.earnConsentsScreen.entryPeriodCard.secondItem" />
                        </Text>
                    </HStack>
                </VStack>
                <HStack style={applyStyle(buttonsRowStyle)}>
                    <Button
                        colorScheme="blueElevation0"
                        onPress={handleLearnMore}
                        style={{ flex: 3 }}
                    >
                        <Translation id="generic.buttons.learnMore" />
                    </Button>
                    <Button colorScheme="blueBold" onPress={handleConfirm} style={{ flex: 7 }}>
                        <Translation id="generic.buttons.understand" />
                    </Button>
                </HStack>
            </Animated.View>
        </Card>
    );
};
