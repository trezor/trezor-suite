import React from 'react';

import { VStack } from '@suite-native/atoms';
import { Screen, ScreenContent, ScreenHeader } from '@suite-native/navigation';

import { CurrencySelector } from '../components/CurrencySelector';

export const SettingsLocalisationScreen = () => (
    <Screen header={<ScreenHeader title="Localisation" />}>
        <ScreenContent>
            <VStack spacing={12}>
                <CurrencySelector />
            </VStack>
        </ScreenContent>
    </Screen>
);
