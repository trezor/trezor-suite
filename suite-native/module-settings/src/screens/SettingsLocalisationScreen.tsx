import React from 'react';

import { Select, VStack } from '@suite-native/atoms';
import { Screen, ScreenHeader } from '@suite-native/navigation';

export const SettingsLocalisationScreen = () => (
    <Screen header={<ScreenHeader title="Localisation" />}>
        <VStack spacing={12}>
            <Select items={[]} selectLabel="Language" value={null} onSelectItem={() => {}} />
            <Select items={[]} selectLabel="Currency" value={null} onSelectItem={() => {}} />
        </VStack>
    </Screen>
);
