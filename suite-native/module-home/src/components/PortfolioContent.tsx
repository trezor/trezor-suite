import { VStack } from '@suite-native/atoms';
import { Assets } from '@suite-native/assets';
import { useIsUsbDeviceConnectFeatureEnabled } from '@suite-native/feature-flags';

import { PortfolioGraph } from './PortfolioGraph';
import { DashboardNavigationButtons } from './DashboardNavigationButtons';

export const PortfolioContent = () => {
    const { isUsbDeviceConnectFeatureEnabled } = useIsUsbDeviceConnectFeatureEnabled();

    return (
        <VStack spacing="large" marginTop="small">
            <PortfolioGraph />
            <Assets />
            {!isUsbDeviceConnectFeatureEnabled && <DashboardNavigationButtons />}
        </VStack>
    );
};
