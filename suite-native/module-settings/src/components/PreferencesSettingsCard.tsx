import { ReactNode } from 'react';

import { Card, HStack, Text, VStack } from '@suite-native/atoms';
import { Icon, IconName } from '@suite-native/icons';

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
    <Card>
        <VStack spacing="sp12">
            <HStack alignItems="center">
                <Icon name={iconName} size="mediumLarge" />
                <Text>{title}</Text>
            </HStack>
            {children}
        </VStack>
    </Card>
);
