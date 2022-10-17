import React from 'react';

import { VStack } from '@suite-native/atoms';
import { Screen } from '@suite-native/navigation';

import { Assets } from '../components/Assets';
import { DashboardHeader } from '../components/DashboardHeader';
import { PortfolioGraph } from '../components/PortfolioGraph';

export const HomeScreen = () => (
    <Screen>
        <VStack spacing={40}>
            <DashboardHeader />
            <PortfolioGraph />
            <Assets />
        </VStack>
    </Screen>
);
