import { type ReactNode } from 'react';
import { FadeInUp, FadeOutDown, LinearTransition } from 'react-native-reanimated';

import { Icon, type IconName } from '@suite-native/icons';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles-native';
import { type Color } from '@trezor/theme';

import { Button, type ButtonColorProps } from '../Button/Button';
import { AnimatedContainerCard } from '../Card/Card';
import { Divider } from '../Divider';
import { AnimatedVStack, HStack, VStack } from '../Stack';
import { Text } from '../Text';

export type CardStepperButtonsActionType = 'destructive' | 'primary';

type CardStepperItemProps = {
    header: ReactNode;
    description: ReactNode;
    isChecked: boolean;
    isOpened: boolean;
    icon: IconName;
    primaryButtonText: ReactNode;
    secondaryButtonText?: ReactNode;
    onPressConfirmButton: () => void;
    onPressSecondaryButton: () => void;
    buttonsActionType?: CardStepperButtonsActionType;
};

const buttonsColorSchemeMap = {
    primary: {
        primary: { intent: 'brand', priority: 'primary' },
        secondary: { intent: 'neutral', priority: 'secondary' },
    },
    destructive: {
        primary: { intent: 'critical', priority: 'primary' },
        secondary: { intent: 'critical', priority: 'secondary' },
    },
} as const satisfies Record<CardStepperButtonsActionType, Record<string, ButtonColorProps>>;

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

const DAMPING = 30;
const STIFFNESS = 180;
const MASS = 1;
const LAYOUT_ANIMATION = LinearTransition.damping(DAMPING).stiffness(STIFFNESS).mass(MASS);
const ENTERING_ANIMATION = FadeInUp.damping(DAMPING).stiffness(STIFFNESS).mass(MASS);
const EXITING_ANIMATION = FadeOutDown.damping(DAMPING).stiffness(STIFFNESS).mass(MASS);

export const CardStepperItem = ({
    header,
    description,
    icon,
    isChecked,
    isOpened,
    onPressConfirmButton,
    onPressSecondaryButton,
    primaryButtonText,
    secondaryButtonText,
    buttonsActionType = 'primary',
}: CardStepperItemProps) => {
    const { applyStyle } = useNativeStyles();
    const iconName = isChecked ? 'check' : icon;
    const headerColor: Color = isChecked ? 'textPrimaryDefault' : 'textSubdued';

    return (
        <AnimatedContainerCard
            layout={LAYOUT_ANIMATION}
            style={applyStyle(cardStyle, { isDisabled: !isOpened && !isChecked })}
        >
            <VStack spacing="sp16">
                <VStack spacing="sp12">
                    <HStack spacing="sp8" alignItems="center">
                        <Icon name={iconName} size="mediumLarge" color={headerColor} />
                        <Text variant="body-sm-strong" color={headerColor}>
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
                        <Text variant="body-md-strong">{description}</Text>
                        <HStack flex={1} spacing="sp12" paddingBottom="sp4">
                            {secondaryButtonText && (
                                <Button
                                    size="medium"
                                    style={applyStyle(buttonStyle)}
                                    {...buttonsColorSchemeMap[buttonsActionType].secondary}
                                    onPress={onPressSecondaryButton}
                                >
                                    {secondaryButtonText}
                                </Button>
                            )}
                            <Button
                                size="medium"
                                style={applyStyle(buttonStyle)}
                                {...buttonsColorSchemeMap[buttonsActionType].primary}
                                onPress={onPressConfirmButton}
                                testID="@cardStepper/confirm-button"
                            >
                                {primaryButtonText}
                            </Button>
                        </HStack>
                    </AnimatedVStack>
                )}
            </VStack>
        </AnimatedContainerCard>
    );
};
