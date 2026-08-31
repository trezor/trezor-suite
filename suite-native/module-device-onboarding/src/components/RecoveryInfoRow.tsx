import { type ReactNode } from 'react';

import { IconListItem, Text, VStack } from '@suite-native/atoms';
import { type IconName } from '@suite-native/icons';

type RecoveryInfoRowProps = {
    iconName: IconName;
    title: ReactNode;
    description: ReactNode;
};

export const RecoveryInfoRow = ({ iconName, title, description }: RecoveryInfoRowProps) => (
    <IconListItem icon={iconName} iconSize="large">
        <VStack spacing="sp4" flex={1}>
            <Text variant="body-md-strong">{title}</Text>
            <Text variant="body-sm" color="contentSecondary">
                {description}
            </Text>
        </VStack>
    </IconListItem>
);
