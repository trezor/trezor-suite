import { type ReactNode } from 'react';
import { type SharedValue, useAnimatedStyle, withDelay, withTiming } from 'react-native-reanimated';

import { AnimatedContainerCard, Text, VStack } from '@suite-native/atoms';
import { Icon, type IconName } from '@suite-native/icons';
import { Translation } from '@suite-native/intl';

type InstructionCardProps = {
    index: number;
    iconName: IconName;
    title: ReactNode;
};

type WalletBackupInstructionCardsProps = {
    isMultishareSelected: boolean;
    isStepFocused: SharedValue<boolean>;
};

const ANIMATION_DURATION = 500;
const ANIMATION_DELAY = 2000;
const DEFAULT_CARD_TRANSLATION_Y = -25;

const getCardProps = (isMultishareSelected: boolean) =>
    [
        {
            iconName: 'pencilSimple',
            title: (
                <Translation id="moduleDeviceOnboarding.walletBackupTutorialScreen.step6.instruction1" />
            ),
        },
        {
            iconName: 'clock',
            title: (
                <Translation
                    id={
                        isMultishareSelected
                            ? 'moduleDeviceOnboarding.walletBackupTutorialScreen.step6.instruction2.multiple'
                            : 'moduleDeviceOnboarding.walletBackupTutorialScreen.step6.instruction2.single'
                    }
                />
            ),
        },
        {
            iconName: 'eyeSlash',
            title: (
                <Translation id="moduleDeviceOnboarding.walletBackupTutorialScreen.step6.instruction3" />
            ),
        },
    ] as const satisfies Omit<InstructionCardProps, 'index'>[];

const WalletBackupInstructionCard = ({
    iconName,
    title,
    index,
    isStepFocused,
}: InstructionCardProps & { isStepFocused: SharedValue<boolean> }) => {
    const animatedCardStyle = useAnimatedStyle(() => {
        const indexDelay = ANIMATION_DURATION + ANIMATION_DELAY * index;

        if (!isStepFocused.value) {
            return {
                opacity: 0,
                transform: [
                    {
                        translateY: DEFAULT_CARD_TRANSLATION_Y,
                    },
                ],
            };
        }

        return {
            opacity: withDelay(
                indexDelay,
                withTiming(1, {
                    duration: ANIMATION_DURATION,
                }),
            ),
            transform: [
                {
                    translateY: withDelay(
                        indexDelay,
                        withTiming(isStepFocused.value ? 0 : DEFAULT_CARD_TRANSLATION_Y, {
                            duration: ANIMATION_DURATION,
                        }),
                    ),
                },
            ],
        };
    });

    return (
        <AnimatedContainerCard
            animatedStyle={animatedCardStyle}
            borderColor="borderNeutral"
            noShadow
        >
            <VStack spacing="sp8" alignItems="center">
                <Icon name={iconName} size={28} />
                <Text variant="body-md-strong">{title}</Text>
            </VStack>
        </AnimatedContainerCard>
    );
};

export const WalletBackupInstructionCards = ({
    isMultishareSelected,
    isStepFocused,
}: WalletBackupInstructionCardsProps) => (
    <VStack spacing="sp16" alignSelf="stretch" marginTop="sp32" flex={1}>
        {getCardProps(isMultishareSelected).map((card, index) => (
            <WalletBackupInstructionCard
                key={card.iconName}
                {...card}
                index={index}
                isStepFocused={isStepFocused}
            />
        ))}
    </VStack>
);
