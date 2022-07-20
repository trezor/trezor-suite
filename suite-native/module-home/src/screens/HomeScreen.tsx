import React from 'react';

import { Button, VStack } from '@suite-native/atoms';
import { StackProps, Screen } from '@suite-native/navigation';

import { HomeStackParamList, HomeStackRoutes } from '../navigation/routes';
import { Assets } from '../components/Assets';
import { Transactions } from '../components/Transactions';
import { PortfolioGraph } from '../components/PortfolioGraph';
import { DashboardHeader } from '../components/DashboardHeader';

export const HomeScreen = ({
    navigation,
}: StackProps<HomeStackParamList, HomeStackRoutes.Home>) => (
    <Screen>
        <VStack spacing={40} padding="medium">
            <DashboardHeader />
            <Button
                onPress={() =>
                    navigation.navigate(HomeStackRoutes.HomeDemo, {
                        message: 'Component Demo',
                    })
                }
            >
                See Component Demo
            </Button>
            <PortfolioGraph />
            <Assets />
            <Transactions />
        </VStack>
    </Screen>
);
