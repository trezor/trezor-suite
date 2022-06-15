import React, { ReactNode } from 'react';

import { Box, Text } from '@suite-native/atoms';

type SettingsSectionProps = {
    title: string;
    children: ReactNode;
    rightIcon?: ReactNode;
};

export const SettingsSection = ({ title, children, rightIcon }: SettingsSectionProps) => (
    <Box>
        <Box flexDirection="row" justifyContent="space-between">
            <Text variant="titleMedium">{title}</Text>
            {rightIcon && rightIcon}
        </Box>
        <Box>{children}</Box>
    </Box>
);
