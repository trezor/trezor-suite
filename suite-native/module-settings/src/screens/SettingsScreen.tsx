import { useSelector } from 'react-redux';

import { selectHasOnlyEmptyPortfolioTracker } from '@suite-common/wallet-core';
import { VStack } from '@suite-native/atoms';
import { selectAreGetTrezorPromoBannersDisabled } from '@suite-native/banner-flags';
import { DeviceManagerScreenHeader } from '@suite-native/device-manager';
import { Screen } from '@suite-native/navigation';

import { AppTitleAndVersion } from '../components/AppTitleAndVersion';
import { ConnectionSettings } from '../components/ConnectionSettings';
import { FeaturesSettings } from '../components/FeaturesSettings';
import { GeneralSettings } from '../components/GeneralSettings';
import { GetTrezorCard } from '../components/GetTrezorCard';

export const SettingsScreen = () => {
    const shouldShowEshopPromo = useSelector(selectHasOnlyEmptyPortfolioTracker);
    const areGetTrezorPromoBannersDisabled = useSelector(selectAreGetTrezorPromoBannersDisabled);

    return (
        <Screen header={<DeviceManagerScreenHeader />}>
            <VStack spacing="sp40">
                {shouldShowEshopPromo && !areGetTrezorPromoBannersDisabled && <GetTrezorCard />}

                <GeneralSettings />
                <FeaturesSettings />
                <ConnectionSettings />
                <AppTitleAndVersion />
            </VStack>
        </Screen>
    );
};
