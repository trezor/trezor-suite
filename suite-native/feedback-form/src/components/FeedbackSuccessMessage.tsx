import { type ReactNode } from 'react';

import { HStack, RoundedIcon, Text, VStack } from '@suite-native/atoms';

type FeedbackSuccessMessageProps = {
    heading: ReactNode;
    description: ReactNode;
};

export const FeedbackSuccessMessage = ({ heading, description }: FeedbackSuccessMessageProps) => (
    <HStack spacing="sp16" alignItems="center">
        <RoundedIcon name="check" intent="brand" size={40} />
        <VStack spacing="sp1" flex={1}>
            <Text variant="headline-sm">{heading}</Text>
            <Text variant="body-sm" color="contentSecondary">
                {description}
            </Text>
        </VStack>
    </HStack>
);
