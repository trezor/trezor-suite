import React, { useState } from 'react';

import { VStack } from '@suite-native/atoms';
import { Screen } from '@suite-native/navigation';
import { PortfolioGraph } from '@suite-native/module-graph';
import { DevContent } from '@suite-native/module-development';

import { Assets } from '../components/Assets';
import { Transactions } from '../components/Transactions';
import { DashboardHeader } from '../components/DashboardHeader';

export const HomeScreen = () => {
    const [devButtonsVisible, setDevButtonsVisible] = useState(false);

    const handleDevButtonsChangeVisibility = (visible: boolean) => {
        setDevButtonsVisible(visible);
    };

    return (
        <Screen>
            {devButtonsVisible && <DevContent />}
            <VStack spacing={40}>
                <DashboardHeader
                    devButtonsVisible={devButtonsVisible}
                    onDevButtonsChangeVisibility={handleDevButtonsChangeVisibility}
                />
                <PortfolioGraph />
                <Assets />
                <Transactions />
            </VStack>
        </Screen>
    );
};
