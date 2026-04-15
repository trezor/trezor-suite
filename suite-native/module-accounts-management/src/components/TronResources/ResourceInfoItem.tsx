import { type ReactNode } from 'react';

import { Text, VStack } from '@suite-native/atoms';

export type ResourceInfoItemProps = {
    label: ReactNode;
    description: ReactNode;
};

export const ResourceInfoItem = ({ label, description }: ResourceInfoItemProps) => (
    <VStack spacing="sp8">
        <Text variant="headline-sm">{label}</Text>
        <Text variant="body-sm" color="textSubdued">
            {description}
        </Text>
    </VStack>
);
