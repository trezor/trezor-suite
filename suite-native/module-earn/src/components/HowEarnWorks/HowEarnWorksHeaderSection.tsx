import { type ReactNode } from 'react';

import { Text, VStack } from '@suite-native/atoms';

type HowEarnWorksHeaderSectionProps = {
    title: ReactNode;
    subtitle: ReactNode;
};

export const HowEarnWorksHeaderSection = ({ title, subtitle }: HowEarnWorksHeaderSectionProps) => (
    <VStack spacing="sp24" paddingTop="sp16">
        <VStack justifyContent="flex-start" alignItems="flex-start" spacing={0}>
            <Text variant="headline-md">{title}</Text>
            <Text variant="body-sm" color="contentSecondary">
                {subtitle}
            </Text>
        </VStack>
    </VStack>
);
