import React from 'react';

import { Screen, ScreenHeader } from '@suite-native/navigation';
import { Box, Text } from '@suite-native/atoms';

import { ColorSchemePicker } from '../components/ColorSchemePicker';

export const SettingsCustomizationScreen = () => (
    <Screen
        header={
            <ScreenHeader
                titleComponent={<Text variant="titleSmall">Customization</Text>}
                hasGoBackIcon
            />
        }
    >
        <Box marginHorizontal="medium">
            <ColorSchemePicker />
        </Box>
    </Screen>
);
