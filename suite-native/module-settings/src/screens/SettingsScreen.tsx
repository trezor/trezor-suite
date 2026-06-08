import { useSelector } from 'react-redux';

import { selectHasOnlyEmptyPortfolioTracker } from '@suite-common/wallet-core';
import { VStack } from '@suite-native/atoms';
import { DeviceManagerScreenHeader } from '@suite-native/device-manager';
import { Screen } from '@suite-native/navigation';

import { AppTitleAndVersion } from '../components/AppTitleAndVersion';
import { ConnectionSettings } from '../components/ConnectionSettings';
import { FeaturesSettings } from '../components/FeaturesSettings';
import { GeneralSettings } from '../components/GeneralSettings';
import { GetTrezorCard } from '../components/GetTrezorCard';

export const SettingsScreen = () => {
    const shouldShowEshopPromo = useSelector(selectHasOnlyEmptyPortfolioTracker);

    return (
        <Screen header={<DeviceManagerScreenHeader />}>
            <VStack spacing="sp48" paddingTop="sp8">
                {shouldShowEshopPromo && <GetTrezorCard />}

                <VStack spacing="sp40">
                    <GeneralSettings />
                    <FeaturesSettings />
                    <ConnectionSettings />
                    <AppTitleAndVersion />
                </VStack>
            </VStack>
        </Screen>
    );
};
