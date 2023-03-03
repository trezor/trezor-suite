import React from 'react';
import { useDispatch, useSelector } from 'react-redux';

import { Screen, ScreenHeader } from '@suite-native/navigation';
import { Box, Card } from '@suite-native/atoms';

import { ColorSchemePicker } from '../components/ColorSchemePicker';
import { TouchableSwitchRow } from '../components/TouchableSwitchRow';
import { selectIsSatsEnabled, toggleIsSatsEnabled } from '../slice';

const SatsSwitchRow = () => {
    const isSatsEnabled = useSelector(selectIsSatsEnabled);
    const dispatch = useDispatch();

    const toggleSats = () => {
        dispatch(toggleIsSatsEnabled());
    };

    return (
        <TouchableSwitchRow
            text="Enable sats unit"
            isChecked={isSatsEnabled}
            onChange={toggleSats}
        />
    );
};

export const SettingsCustomizationScreen = () => (
    <Screen header={<ScreenHeader title="Customization" hasGoBackIcon />}>
        <Card>
            <SatsSwitchRow />
        </Card>
        <Box marginHorizontal="medium" marginTop="medium">
            <ColorSchemePicker />
        </Box>
    </Screen>
);
