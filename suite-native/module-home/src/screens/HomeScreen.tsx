import { useSelector } from 'react-redux';

import { VStack } from '@suite-native/atoms';
import { Screen } from '@suite-native/navigation';
import { Assets, selectIsPortfolioEmpty } from '@suite-native/assets';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles';
import { selectIsDeviceDiscoveryActive } from '@suite-common/wallet-core';
import { useIsUsbDeviceConnectFeatureEnabled } from '@suite-native/feature-flags';

import { PortfolioGraph } from '../components/PortfolioGraph';
import { DashboardNavigationButtons } from '../components/DashboardNavigationButtons';
import { EmptyHomeScreenPlaceholder } from '../components/EmptyHomeScreenPlaceholder';
import { MAX_ASSETS_ON_DASHBOARD } from '../constants';

const HOME_SCREEN_MARGIN_TOP = 72;

const homeScreenContentStyle = prepareNativeStyle(_ => ({
    marginTop: HOME_SCREEN_MARGIN_TOP,
}));

export const HomeScreen = () => {
    const { applyStyle } = useNativeStyles();

    const isPortfolioEmpty = useSelector(selectIsPortfolioEmpty);
    const isDiscoveryActive = useSelector(selectIsDeviceDiscoveryActive);
    const { isUsbDeviceConnectFeatureEnabled } = useIsUsbDeviceConnectFeatureEnabled();

    return (
        <Screen>
            {isPortfolioEmpty && !isDiscoveryActive ? (
                <EmptyHomeScreenPlaceholder />
            ) : (
                <VStack spacing="large" style={applyStyle(homeScreenContentStyle)}>
                    <PortfolioGraph />
                    <Assets maximumAssetsVisible={MAX_ASSETS_ON_DASHBOARD} />
                    {!isUsbDeviceConnectFeatureEnabled && <DashboardNavigationButtons />}
                </VStack>
            )}
        </Screen>
    );
};
