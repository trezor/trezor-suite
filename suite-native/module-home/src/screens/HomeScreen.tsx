import React from 'react';

import { VStack } from '@suite-native/atoms';
import { Screen, ScreenContent } from '@suite-native/navigation';
import { Assets } from '@suite-native/assets';

import { DashboardHeader } from '../components/DashboardHeader';
import { PortfolioGraph } from '../components/PortfolioGraph';

export const HomeScreen = () => (
    <Screen>
        <ScreenContent>
            <VStack spacing="large">
                <DashboardHeader />
                <PortfolioGraph />
                <Assets />
            </VStack>
        </ScreenContent>
    </Screen>
);
