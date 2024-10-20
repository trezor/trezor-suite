import { ReactNode } from 'react';
import { TouchableOpacity } from 'react-native';

import { Box, Text, VStack, Card } from '@suite-native/atoms';
import { Icon, IconName } from '@suite-native/icons';

type SettingsSectionProps = {
    title: ReactNode;
    children: ReactNode;
    rightIconName?: IconName;
    onRightIconPress?: () => void;
    subtitle?: string;
};

export const SettingsSection = ({
    title,
    subtitle,
    children,
    rightIconName,
    onRightIconPress,
}: SettingsSectionProps) => (
    <Box>
        <Box
            flexDirection="row"
            justifyContent="space-between"
            alignItems="center"
            marginBottom="sp16"
            marginLeft="sp16"
        >
            <Box>
                <Text variant="titleSmall">{title}</Text>
                {subtitle && (
                    <Text color="textSubdued" variant="hint">
                        {subtitle}
                    </Text>
                )}
            </Box>
            {rightIconName && (
                <TouchableOpacity onPress={onRightIconPress}>
                    <Icon name={rightIconName} />
                </TouchableOpacity>
            )}
        </Box>
        <Card>
            <VStack spacing="sp24">{children}</VStack>
        </Card>
    </Box>
);
