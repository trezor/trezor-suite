import { ReactNode } from 'react';
import {
    FadeIn,
    FadeOutUp,
    useAnimatedStyle,
    withDelay,
    withTiming,
} from 'react-native-reanimated';

import { useNavigation } from '@react-navigation/core';

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

const cardStyle = prepareNativeStyle<{ wasOpened: boolean }>((utils, { wasOpened }) => ({
    backgroundColor: wasOpened
        ? utils.colors.backgroundSurfaceElevationNegative
        : utils.colors.backgroundSurfaceElevation1,
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
    };

    const isFirstStepCard = suspicionCause === 'untrustedReseller';

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

    return (
        <AnimatedCard
            style={[
                animatedCardStyle,
                applyStyle(cardStyle, { wasOpened: !isOpened && !isChecked }),
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
                    {isOpened && <Divider />}
                </VStack>
                {isOpened && (
                    <AnimatedVStack
                        spacing="sp16"
                        entering={isFirstStepCard ? undefined : FadeIn.delay(ANIMATION_DURATION)}
                        exiting={FadeOutUp}
                    >
                        <Text variant="highlight">{description}</Text>
                        <HStack flex={1} spacing="sp12" justifyContent="space-between">
                            <Button
                                size="small"
                                style={applyStyle(buttonStyle)}
                                onPress={onPressConfirmButton}
                            >
                                <Translation id="generic.buttons.yes" />
                            </Button>
                            <Button
                                size="small"
                                style={applyStyle(buttonStyle)}
                                colorScheme="tertiaryElevation0"
                                onPress={navigateToSuspiciousDeviceScreen}
                            >
                                <Translation id="moduleDeviceOnboarding.securityCheckScreen.declineButton" />
                            </Button>
                        </HStack>
                    </AnimatedVStack>
                )}
            </VStack>
        </AnimatedCard>
    );
};
