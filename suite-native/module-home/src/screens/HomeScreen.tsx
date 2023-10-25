import { useSelector } from 'react-redux';

import { VStack } from '@suite-native/atoms';
import { Screen } from '@suite-native/navigation';
import { Assets, selectIsPortfolioEmpty } from '@suite-native/assets';
import { selectIsDeviceDiscoveryActive } from '@suite-common/wallet-core';
import { useIsUsbDeviceConnectFeatureEnabled } from '@suite-native/feature-flags';

import { PortfolioGraph } from '../components/PortfolioGraph';
import { DashboardNavigationButtons } from '../components/DashboardNavigationButtons';
import { EmptyHomeScreenPlaceholder } from '../components/EmptyHomeScreenPlaceholder';
import { MAX_ASSETS_ON_DASHBOARD } from '../constants';
import { BiometricsBottomSheet } from '../components/BiometricsBottomSheet';

export const HomeScreen = () => {
    const isPortfolioEmpty = useSelector(selectIsPortfolioEmpty);
    const isDiscoveryActive = useSelector(selectIsDeviceDiscoveryActive);
    const { isUsbDeviceConnectFeatureEnabled } = useIsUsbDeviceConnectFeatureEnabled();

    return (
        <Screen>
            {isPortfolioEmpty && !isDiscoveryActive ? (
                <EmptyHomeScreenPlaceholder />
            ) : (
                <VStack spacing="large">
                    <PortfolioGraph />
                    <Assets maximumAssetsVisible={MAX_ASSETS_ON_DASHBOARD} />
                    {!isUsbDeviceConnectFeatureEnabled && <DashboardNavigationButtons />}
                </VStack>
            )}
            <BiometricsBottomSheet />
        </Screen>
    );
};
