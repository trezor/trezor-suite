import { type ReactNode } from 'react';

import { Card, HStack, Text, VStack } from '@suite-native/atoms';
import { Icon, type IconName } from '@suite-native/icons';

type SettingsFormCardProps = {
    icon: IconName;
    title: ReactNode;
    badge?: ReactNode;
    children: ReactNode;
};

export const SettingsFormCard = ({ icon, title, badge, children }: SettingsFormCardProps) => (
    <Card>
        <VStack spacing="sp16">
            <HStack alignItems="center" justifyContent="space-between">
                <HStack alignItems="center">
                    <Icon name={icon} size="mediumLarge" />
                    <Text>{title}</Text>
                </HStack>
                {badge}
            </HStack>
            {children}
        </VStack>
    </Card>
);
