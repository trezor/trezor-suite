import React from 'react';

import { VStack } from '@suite-native/atoms';
import { Screen } from '@suite-native/navigation';

import { ApplicationSettings } from '../components/ApplicationSettings';
import { DeviceSettings } from '../components/DeviceSettings';

export const SettingsScreen = () => (
    <Screen>
        <VStack spacing="xxl">
            <ApplicationSettings />
            <DeviceSettings />
        </VStack>
    </Screen>
);
