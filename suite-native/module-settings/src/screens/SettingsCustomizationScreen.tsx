import React from 'react';

import { Screen, ScreenHeader } from '@suite-native/navigation';
import { Box } from '@suite-native/atoms';

import { ColorSchemePicker } from '../components/ColorSchemePicker';

export const SettingsCustomizationScreen = () => (
    <Screen header={<ScreenHeader title="Customization" />}>
        <Box marginHorizontal="medium">
            <ColorSchemePicker />
        </Box>
    </Screen>
);
