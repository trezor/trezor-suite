import { ReactNode } from 'react';
import { FadeInUp, FadeOutDown, LinearTransition } from 'react-native-reanimated';

import {
    AnimatedCard,
    AnimatedVStack,
    Button,
    ButtonColorScheme,
    Divider,
    HStack,
    Text,
    VStack,
} from '@suite-native/atoms';
import { Icon, IconName } from '@suite-native/icons';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles';
import { Color } from '@trezor/theme';

export type CardStepperButtonsActionType = 'destructive' | 'primary';

type CardStepperItemProps = {
    header: ReactNode;
    description: ReactNode;
    isChecked: boolean;
    isOpened: boolean;
    icon: IconName;
    primaryButtonText: ReactNode;
    secondaryButtonText: ReactNode;
    onPressConfirmButton: () => void;
    onPressSecondaryButton: () => void;
    buttonsActionType?: CardStepperButtonsActionType;
};

const buttonsColorSchemeMap = {
    primary: {
        primary: 'primary',
        secondary: 'tertiaryElevation0',
    },
    destructive: {
        primary: 'redBold',
        secondary: 'redElevation0',
    },
} as const satisfies Record<CardStepperButtonsActionType, Record<string, ButtonColorScheme>>;

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
                                colorScheme={buttonsColorSchemeMap[buttonsActionType].secondary}
                                onPress={onPressSecondaryButton}
                            >
                                {primaryButtonText}
                            </Button>
                            <Button
                                size="small"
                                style={applyStyle(buttonStyle)}
                                colorScheme={buttonsColorSchemeMap[buttonsActionType].primary}
                                onPress={onPressConfirmButton}
                            >
                                {secondaryButtonText}
                            </Button>
                        </HStack>
                    </AnimatedVStack>
                )}
            </VStack>
        </AnimatedCard>
    );
};
