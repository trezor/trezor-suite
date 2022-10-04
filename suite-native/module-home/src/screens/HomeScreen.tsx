import React from 'react';

import { VStack } from '@suite-native/atoms';
import { Screen } from '@suite-native/navigation';
import { PortfolioGraph } from '@suite-native/module-graph';
import { QRCode } from '@suite-native/qr-code-generator';

import { Assets } from '../components/Assets';
import { DashboardHeader } from '../components/DashboardHeader';

export const HomeScreen = () => (
    <Screen>
        <VStack spacing={40}>
            <QRCode value="test test test test test" />
            <DashboardHeader />
            <PortfolioGraph />
            <Assets />
        </VStack>
    </Screen>
);
