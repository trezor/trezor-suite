import { useSelector } from 'react-redux';

import { DeviceManager } from '@suite-native/device-manager';
import { Screen, ScreenHeader } from '@suite-native/navigation';
import { selectIsPortfolioEmpty } from '@suite-common/wallet-core';

import { EmptyHomeRenderer } from '../components/EmptyHomeRenderer';
import { PortfolioContent } from '../components/PortfolioContent';
import { BiometricsBottomSheet } from '../components/BiometricsBottomSheet';

export const HomeScreen = () => {
    const isPortfolioEmpty = useSelector(selectIsPortfolioEmpty);

    return (
        <Screen
            screenHeader={
                <ScreenHeader hasBottomPadding>
                    <DeviceManager />
                </ScreenHeader>
            }
        >
            {isPortfolioEmpty ? <EmptyHomeRenderer /> : <PortfolioContent />}
            <BiometricsBottomSheet />
        </Screen>
    );
};
