import { ReactNode } from 'react';

import { Text, VStack } from '@suite-native/atoms';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles';

type SwipeableWalkthroughStepHeaderProps = {
    callout: ReactNode;
    title: ReactNode;
    description?: ReactNode;
};

const titleStyle = prepareNativeStyle(() => ({
    letterSpacing: -1.4,
}));

export const SwipeableWalkthroughStepHeader = ({
    callout,
    title,
    description,
}: SwipeableWalkthroughStepHeaderProps) => {
    const { applyStyle } = useNativeStyles();

    return (
        <VStack spacing="sp8">
            <VStack spacing="sp12">
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
