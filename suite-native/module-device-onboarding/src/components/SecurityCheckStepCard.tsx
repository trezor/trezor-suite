import { ReactNode } from 'react';
import { FadeInUp, FadeOutDown, LinearTransition } from 'react-native-reanimated';

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

const cardStyle = prepareNativeStyle<{ isDisabled: boolean }>((utils, { isDisabled }) => ({
    backgroundColor: utils.colors.backgroundSurfaceElevation1,
    borderColor: utils.colors.borderOnElevation1,
    borderWidth: 1,
    paddingVertical: utils.spacings.sp12,
    overflow: 'hidden',

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

const DAMPING = 14;
const LAYOUT_ANIMATION = LinearTransition.springify().damping(DAMPING);
const ENTERING_ANIMATION = FadeInUp.springify().damping(DAMPING);
const EXITING_ANIMATION = FadeOutDown.springify().damping(DAMPING);

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

    return (
        <AnimatedCard
            layout={LAYOUT_ANIMATION}
            style={[applyStyle(cardStyle, { isDisabled: !isOpened && !isChecked })]}
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
                    <AnimatedVStack
                        spacing="sp16"
                        layout={LAYOUT_ANIMATION}
                        entering={ENTERING_ANIMATION}
                        exiting={EXITING_ANIMATION}
                    >
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
