import { type ReactNode } from 'react';

import { Text, VStack } from '@suite-native/atoms';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles-native';

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

    if (!title || !callout) return;

    return (
        <VStack spacing="sp8">
            <VStack spacing="sp12" alignItems="center">
                <Text variant="body-md-strong" color="textSecondaryHighlight" textAlign="center">
                    {callout}
                </Text>
                <Text variant="headline-md" textAlign="center" style={applyStyle(titleStyle)}>
                    {title}
                </Text>
            </VStack>
            {description && (
                <Text variant="body-md" color="textSubdued" textAlign="center">
                    {description}
                </Text>
            )}
        </VStack>
    );
};
