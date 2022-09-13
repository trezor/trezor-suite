import React from 'react';
import { NativeModules } from 'react-native';

import { Button, VStack } from '@suite-native/atoms';
import { Screen } from '@suite-native/navigation';
import { PortfolioGraph } from '@suite-native/module-graph';
import { persistor } from '@suite-native/state';

import { Assets } from '../components/Assets';
import { Transactions } from '../components/Transactions';
import { DashboardHeader } from '../components/DashboardHeader';

export const HomeScreen = () => {
    const handleResetStorage = async () => {
        await persistor.purge();
        NativeModules.DevSettings.reload();
    };

    return (
        <Screen>
            <VStack spacing={40}>
                <DashboardHeader />
                <PortfolioGraph />
                <Assets />
                <Transactions />
                {/* TODO replace with config when this PR is merged https://github.com/trezor/trezor-suite/pull/6266 */}
                {__DEV__ && (
                    <Button colorScheme="primary" onPress={handleResetStorage}>
                        Reset storage
                    </Button>
                )}
            </VStack>
        </Screen>
    );
};
