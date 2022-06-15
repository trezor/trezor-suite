import React, { ReactNode } from 'react';

import { Box, Text } from '@suite-native/atoms';

type SettingsSectionProps = { title: string; children: ReactNode };

export const SettingsSection = ({ title, children }: SettingsSectionProps) => (
    <Box>
        <Text variant="titleMedium">{title}</Text>
        <Box>{children}</Box>
    </Box>
);
