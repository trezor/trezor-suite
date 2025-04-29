import { ReactNode } from 'react';
import { FadeOutUp, useAnimatedStyle, withDelay, withTiming } from 'react-native-reanimated';

import { useNavigation } from '@react-navigation/core';

import { EventType, analytics } from '@suite-native/analytics';
import {
    AnimatedCard,
    AnimatedVStack,
    Button,
    Divider,
    HStack,
    Text,
    VStack,
} from '@suite-native/atoms';
import { Icon, IconName } from '@suite-native/icons';
import { Translation } from '@suite-native/intl';
import {
    DeviceOnboardingStackParamList,
    DeviceOnboardingStackRoutes,
    DeviceSuspicionCause,
    StackNavigationProps,
} from '@suite-native/navigation';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles';
import { Color } from '@trezor/theme';

type SecurityCheckStepCardProps = {
    header: ReactNode;
    description: ReactNode;
    isChecked: boolean;
    isOpened: boolean;
    icon: IconName;
    onPressConfirmButton: () => void;
    suspicionCause: DeviceSuspicionCause;
};

type NavigationProps = StackNavigationProps<
    DeviceOnboardingStackParamList,
    DeviceOnboardingStackRoutes.SecurityCheck
>;

const ANIMATION_DURATION = 300;

const cardStyle = prepareNativeStyle<{ isDisabled: boolean }>((utils, { isDisabled }) => ({
    backgroundColor: utils.colors.backgroundSurfaceElevation1,
    borderColor: utils.colors.borderOnElevation1,
    borderWidth: 1,
    paddingVertical: utils.spacings.sp12,

    extend: {
        condition: isDisabled,
        style: {
            backgroundColor: utils.colors.backgroundSurfaceElevationNegative,
            borderColor: utils.colors.borderOnElevation0,
            ...utils.boxShadows.none,
        },
    },
}));

const dividerStyle = prepareNativeStyle(utils => ({
    marginHorizontal: -utils.spacings.sp16,
}));

const buttonStyle = prepareNativeStyle(() => ({
    flex: 1,
}));

export const SecurityCheckStepCard = ({
    header,
    description,
    icon,
    isChecked,
    isOpened,
    onPressConfirmButton,
    suspicionCause,
}: SecurityCheckStepCardProps) => {
    const { applyStyle } = useNativeStyles();
    const navigation = useNavigation<NavigationProps>();
    const iconName = isChecked ? 'check' : icon;
    const headerColor: Color = isChecked ? 'textPrimaryDefault' : 'textSubdued';

    const navigateToSuspiciousDeviceScreen = () => {
        navigation.navigate(DeviceOnboardingStackRoutes.SuspiciousDevice, {
            suspicionCause,
        });
        analytics.report({
            type: EventType.DeviceSetupSecurityCheck,
            payload: {
                location: suspicionCause,
            },
        });
    };
    const animatedCardStyle = useAnimatedStyle(
        () => ({
            minHeight: withDelay(
                isOpened ? ANIMATION_DURATION : 0,
                withTiming(isOpened ? 180 : 44, {
                    duration: ANIMATION_DURATION,
                }),
            ),
        }),
        [isOpened],
    );

    const contentAnimatedStyle = useAnimatedStyle(() => ({
        height: withTiming(isOpened ? 110 : 0, {
            duration: ANIMATION_DURATION,
        }),
        opacity: withDelay(
            ANIMATION_DURATION,
            withTiming(isOpened ? 1 : 0, {
                duration: ANIMATION_DURATION,
            }),
        ),
    }));

    return (
        <AnimatedCard
            style={[
                animatedCardStyle,
                applyStyle(cardStyle, { isDisabled: !isOpened && !isChecked }),
            ]}
        >
            <VStack spacing="sp16">
                <VStack spacing="sp12">
                    <HStack spacing="sp8" alignItems="center">
                        <Icon name={iconName} size="mediumLarge" color={headerColor} />
                        <Text variant="callout" color={headerColor}>
                            {header}
                        </Text>
                    </HStack>
                    {isOpened && <Divider style={applyStyle(dividerStyle)} />}
                </VStack>
                {isOpened && (
                    <AnimatedVStack spacing="sp16" style={contentAnimatedStyle} exiting={FadeOutUp}>
                        <Text variant="highlight">{description}</Text>
                        <HStack
                            flex={1}
                            spacing="sp12"
                            justifyContent="space-between"
                            paddingBottom="sp4"
                        >
                            <Button
                                size="small"
                                style={applyStyle(buttonStyle)}
                                colorScheme="tertiaryElevation0"
                                onPress={navigateToSuspiciousDeviceScreen}
                            >
                                <Translation id="moduleDeviceOnboarding.securityCheckScreen.declineButton" />
                            </Button>
                            <Button
                                size="small"
                                style={applyStyle(buttonStyle)}
                                onPress={onPressConfirmButton}
                            >
                                <Translation id="generic.buttons.yes" />
                            </Button>
                        </HStack>
                    </AnimatedVStack>
                )}
            </VStack>
        </AnimatedCard>
    );
};
