import { type ReactNode } from 'react';

import { Card, HStack, Text, VStack } from '@suite-native/atoms';
import { Icon, type IconName } from '@suite-native/icons';

type PreferencesSettingsCardProps = {
    iconName: IconName;
    title: ReactNode;
    children: ReactNode;
};

export const PreferencesSettingsCard = ({
    iconName,
    title,
    children,
}: PreferencesSettingsCardProps) => (
    <Card noShadow>
        <VStack spacing="sp12">
            <HStack alignItems="center">
                <Icon name={iconName} size="mediumLarge" />
                <Text>{title}</Text>
            </HStack>
            {children}
        </VStack>
    </Card>
);
