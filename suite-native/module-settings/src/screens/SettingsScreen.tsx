import React from 'react';

import { VStack } from '@suite-native/atoms';
import { Screen, ScreenContent } from '@suite-native/navigation';

import { ApplicationSettings } from '../components/ApplicationSettings';

export const SettingsScreen = () => (
    <Screen>
        <ScreenContent>
            <VStack spacing="xxl">
                <ApplicationSettings />
            </VStack>
        </ScreenContent>
    </Screen>
);
