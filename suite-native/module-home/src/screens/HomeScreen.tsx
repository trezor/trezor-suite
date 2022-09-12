import React from 'react';

import { VStack } from '@suite-native/atoms';
import { Screen } from '@suite-native/navigation';
import { PortfolioGraph } from '@suite-native/module-graph';

import { Assets } from '../components/Assets';
import { Transactions } from '../components/Transactions';
import { DashboardHeader } from '../components/DashboardHeader';

export const HomeScreen = () => (
    <Screen>
        <VStack spacing={40}>
            <DashboardHeader />
            <PortfolioGraph />
            <Assets />
            <Transactions />
        </VStack>
    </Screen>
);
