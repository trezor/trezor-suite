import { ReactNode } from 'react';

import { Text, VStack } from '@suite-native/atoms';

export type ProviderListSectionHeaderProps = {
    title: ReactNode;
    subtitle: ReactNode;
};

export const ProviderListSectionHeader = ({ title, subtitle }: ProviderListSectionHeaderProps) => (
    <VStack marginTop="sp8" paddingVertical="sp12">
        <Text variant="callout" color="textDefault">
            {title}
        </Text>
        <Text variant="hint" color="textSubdued">
            {subtitle}
        </Text>
    </VStack>
);
