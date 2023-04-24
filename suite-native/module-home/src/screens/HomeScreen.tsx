import React from 'react';

import { VStack } from '@suite-native/atoms';
import { Screen } from '@suite-native/navigation';
import { Assets } from '@suite-native/assets';

import { PortfolioGraph } from '../components/PortfolioGraph';
import { DashboardNavigationButtons } from '../components/DashboardNavigationButtons';

export const HomeScreen = () => (
    <Screen>
        <VStack spacing="large">
            <PortfolioGraph />
            <Assets />
            <DashboardNavigationButtons />
        </VStack>
    </Screen>
);
