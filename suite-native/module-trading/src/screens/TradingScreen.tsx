import React from 'react';

import { Screen } from '@suite-native/navigation';
import { Card, Text } from '@suite-native/atoms';
import { DeviceManagerScreenHeader } from '@suite-native/device-manager';

export const TradingScreen = () => (
    <Screen header={<DeviceManagerScreenHeader />}>
        <Card>
            <Text>Trading placeholder</Text>
        </Card>
    </Screen>
);
