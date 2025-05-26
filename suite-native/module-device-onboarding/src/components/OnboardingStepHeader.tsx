import { ReactNode } from 'react';

import { Text, VStack } from '@suite-native/atoms';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles';

type OnboardingStepHeaderProps = {
    callout: ReactNode;
    title: ReactNode;
    description?: ReactNode;
};

const titleStyle = prepareNativeStyle(() => ({
    letterSpacing: -1.4,
}));

export const OnboardingStepHeader = ({
    callout,
    title,
    description,
}: OnboardingStepHeaderProps) => {
    const { applyStyle } = useNativeStyles();

    if (!title || !callout) return;

    return (
        <VStack spacing="sp8">
            <VStack spacing="sp12" alignItems="center">
                <Text variant="highlight" color="textSecondaryHighlight" textAlign="center">
                    {callout}
                </Text>
                <Text variant="titleMedium" textAlign="center" style={applyStyle(titleStyle)}>
                    {title}
                </Text>
            </VStack>
            {description && (
                <Text variant="body" color="textSubdued" textAlign="center">
                    {description}
                </Text>
            )}
        </VStack>
    );
};
