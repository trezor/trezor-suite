import { type ReactNode } from 'react';

import { HStack, ProgressBar, Text, VStack } from '@suite-native/atoms';
import { Icon } from '@suite-native/icons';

export type ResourceProps = {
    label: ReactNode;
    available: number;
    total: number;
};

export const Resource = ({ label, available, total }: ResourceProps) => (
    <VStack spacing="sp8">
        <HStack justifyContent="space-between" alignItems="center">
            <HStack spacing="sp4" alignItems="center">
                <Text variant="body-sm">{label}</Text>
                <Icon name="info" size="medium" color="iconSubdued" />
            </HStack>
            <Text variant="body-sm" color="textSubdued">
                {available} / {total}
            </Text>
        </HStack>
        <ProgressBar value={available} max={total} />
    </VStack>
);
