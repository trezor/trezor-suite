import { ReactNode } from 'react';

import { Box, Text } from '@suite-native/atoms';

export type SettingsSectionItemTextProps = {
    title: ReactNode;
    subtitle?: ReactNode;
};

export const SettingsSectionItemText = ({ title, subtitle }: SettingsSectionItemTextProps) => {
    return (
        <Box justifyContent="center" flexDirection="column" flex={1}>
            <Text>{title}</Text>
            {subtitle && (
                <Text variant="hint" color="textSubdued">
                    {subtitle}
                </Text>
            )}
        </Box>
    );
};
