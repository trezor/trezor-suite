import { type ReactNode } from 'react';

import { HStack, PressableOpacity, Text } from '@suite-native/atoms';
import { Icon } from '@suite-native/icons';

type AssetDetailSectionHeaderProps = {
    title: ReactNode;
    linkLabel: ReactNode;
    onPress: () => void;
    testID: string;
};

export const AssetDetailSectionHeader = ({
    title,
    linkLabel,
    onPress,
    testID,
}: AssetDetailSectionHeaderProps) => (
    <HStack alignItems="center" justifyContent="space-between" spacing="sp8">
        <Text variant="body-xs" color="contentSecondary">
            {title}
        </Text>
        <PressableOpacity accessibilityRole="button" onPress={onPress} testID={testID}>
            <HStack alignItems="center" spacing="sp4">
                <Text variant="body-xs" color="contentBrand">
                    {linkLabel}
                </Text>
                <Icon name="caretRight" size="small" color="contentBrand" />
            </HStack>
        </PressableOpacity>
    </HStack>
);
