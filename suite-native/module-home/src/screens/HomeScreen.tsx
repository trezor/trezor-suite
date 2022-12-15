import React from 'react';

import { Box, Divider, VStack } from '@suite-native/atoms';
import { Screen, ScreenContent } from '@suite-native/navigation';
import { Assets } from '@suite-native/assets';

import { DashboardHeader } from '../components/DashboardHeader';
import { PortfolioGraph } from '../components/PortfolioGraph';

export const HomeScreen = () => (
    <Screen>
        <ScreenContent customHorizontalPadding={0}>
            <VStack spacing="large">
                <Box paddingHorizontal="large">
                    <DashboardHeader />
                </Box>
                <PortfolioGraph />
                <Divider />
                <Box paddingHorizontal="medium">
                    <Assets />
                </Box>
            </VStack>
        </ScreenContent>
    </Screen>
);
