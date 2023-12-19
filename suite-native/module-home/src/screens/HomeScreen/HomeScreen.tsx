import { useRef } from 'react';
import { useSelector } from 'react-redux';

import { selectIsPortfolioEmpty } from '@suite-common/wallet-core';
import { DeviceManagerScreenHeader } from '@suite-native/device-manager';
import { Screen } from '@suite-native/navigation';

import { BiometricsBottomSheet } from './components/BiometricsBottomSheet';
import { EmptyHomeRenderer } from './components/EmptyHomeRenderer';
import { PortfolioContent, PortfolioContentRef } from './components/PortfolioContent';
import { useHomeRefreshControl } from './useHomeRefreshControl';

export const HomeScreen = () => {
    const isPortfolioEmpty = useSelector(selectIsPortfolioEmpty);
    const portfolioContentRef = useRef<PortfolioContentRef>(null);
    const refreshControl = useHomeRefreshControl({ isPortfolioEmpty, portfolioContentRef });
    return (
        <Screen
            screenHeader={<DeviceManagerScreenHeader hasBottomPadding />}
            refreshControl={refreshControl}
            customHorizontalPadding={0}
        >
            {isPortfolioEmpty ? (
                <EmptyHomeRenderer />
            ) : (
                <PortfolioContent ref={portfolioContentRef} />
            )}
            <BiometricsBottomSheet />
        </Screen>
    );
};
