import { ReactNode } from 'react';

import { Text, VStack } from '@suite-native/atoms';

type SettingsSectionProps = {
    title: ReactNode;
    children: ReactNode;
};

export const SettingsSection = ({ title, children }: SettingsSectionProps) => (
    <VStack spacing="sp16">
        <Text variant="titleSmall">{title}</Text>
        {children}
    </VStack>
);
