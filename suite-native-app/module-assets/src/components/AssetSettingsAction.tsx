import { type ReactNode } from 'react';

import { HStack, PressableOpacity, Text } from '@suite-native/atoms';
import { Icon, type IconName } from '@suite-native/icons';

type AssetSettingsActionProps = {
    iconName: IconName;
    label: ReactNode;
    onPress: () => void;
    testID: string;
    rightContent?: ReactNode;
};

export const AssetSettingsAction = ({
    iconName,
    label,
    onPress,
    testID,
    rightContent,
}: AssetSettingsActionProps) => (
    <PressableOpacity accessibilityRole="button" onPress={onPress} testID={testID}>
        <HStack alignItems="center" justifyContent="space-between" paddingVertical="sp12">
            <HStack alignItems="center" spacing="sp16">
                <Icon name={iconName} size="medium" />
                <Text variant="body-sm">{label}</Text>
            </HStack>
            {rightContent}
        </HStack>
    </PressableOpacity>
);
