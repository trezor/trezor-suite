import React from 'react';

import { Card, Text } from '@suite-native/atoms';
import { DeviceManagerScreenHeader } from '@suite-native/device-manager';
import { Screen } from '@suite-native/navigation';

export const TradingScreen = () => (
    <Screen header={<DeviceManagerScreenHeader />}>
        <Card>
            <Text>Trading placeholder</Text>
        </Card>
    </Screen>
);
