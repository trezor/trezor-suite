import { type ReactNode } from 'react';

import { Text, VStack } from '@suite-native/atoms';

export type ProviderListSectionHeaderProps = {
    title: ReactNode;
    subtitle: ReactNode;
};

export const ProviderListSectionHeader = ({ title, subtitle }: ProviderListSectionHeaderProps) => (
    <VStack marginTop="sp8" paddingVertical="sp12">
        <Text variant="body-sm-strong" color="contentPrimary">
            {title}
        </Text>
        <Text variant="body-sm" color="contentSecondary">
            {subtitle}
        </Text>
    </VStack>
);
