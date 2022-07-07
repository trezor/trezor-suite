import React, { ReactNode } from 'react';
import { TouchableOpacity } from 'react-native';

import { Box, Text, VStack } from '@suite-native/atoms';
import { Icon, IconName } from '@trezor/icons';

type SettingsSectionProps = {
    title: string;
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
            marginBottom="large"
        >
            <Box>
                <Text variant="titleMedium">{title}</Text>
                {subtitle && (
                    <Text color="gray600" variant="hint">
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
        <VStack spacing="medium">{children}</VStack>
    </Box>
);
