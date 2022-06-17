import React, { ReactNode } from 'react';

import { Box, Text, VStack } from '@suite-native/atoms';

type SettingsSectionProps = {
    title: string;
    children: ReactNode;
    rightIcon?: ReactNode;
    subtitle?: string;
};

export const SettingsSection = ({ title, subtitle, children, rightIcon }: SettingsSectionProps) => (
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
            {rightIcon && rightIcon}
        </Box>
        <VStack spacing="medium">{children}</VStack>
    </Box>
);
