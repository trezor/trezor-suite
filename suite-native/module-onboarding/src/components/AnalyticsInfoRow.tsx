import { type ReactNode } from 'react';

import { IconListItem, Text, VStack } from '@suite-native/atoms';
import { type IconName } from '@suite-native/icons';

type AnalyticsInfoRowProps = {
    iconName: IconName;
    title: ReactNode;
    description: ReactNode;
};

export const AnalyticsInfoRow = ({ iconName, title, description }: AnalyticsInfoRowProps) => (
    <IconListItem icon={iconName} iconSize="mediumLarge">
        <VStack spacing="sp4" flex={1}>
            <Text variant="body-md-strong">{title}</Text>
            <Text variant="body-sm" color="contentSecondary">
                {description}
            </Text>
        </VStack>
    </IconListItem>
);
