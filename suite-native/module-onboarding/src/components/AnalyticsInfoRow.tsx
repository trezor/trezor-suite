import { ReactNode } from 'react';

import { IconListItem, Text, VStack } from '@suite-native/atoms';
import { IconName } from '@suite-native/icons';

type AnalyticsInfoRowProps = {
    iconName: IconName;
    title: ReactNode;
    description: ReactNode;
};

export const AnalyticsInfoRow = ({ iconName, title, description }: AnalyticsInfoRowProps) => (
    <IconListItem icon={iconName} iconSize="mediumLarge">
        <VStack spacing="sp4" flex={1}>
            <Text variant="highlight">{title}</Text>
            <Text variant="hint" color="textSubdued">
                {description}
            </Text>
        </VStack>
    </IconListItem>
);
