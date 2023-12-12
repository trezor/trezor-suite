import { useDispatch, useSelector } from 'react-redux';
import { useCallback, useMemo, useRef, useState } from 'react';
import { RefreshControl } from 'react-native';

import { DeviceManagerScreenHeader } from '@suite-native/device-manager';
import { Screen } from '@suite-native/navigation';
import { selectIsPortfolioEmpty } from '@suite-common/wallet-core';
import { useNativeStyles } from '@trezor/styles';
import { syncAllAccountsWithBlockchainThunk } from '@suite-native/blockchain';

import { EmptyHomeRenderer } from '../components/EmptyHomeRenderer';
import { PortfolioContent, PortfolioContentRef } from '../components/PortfolioContent';
import { BiometricsBottomSheet } from '../components/BiometricsBottomSheet';

export const HomeScreen = () => {
    const isPortfolioEmpty = useSelector(selectIsPortfolioEmpty);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const dispatch = useDispatch();
    const {
        utils: { colors },
    } = useNativeStyles();
    const portfolioContentRef = useRef<PortfolioContentRef>(null);

    const handleRefresh = useCallback(async () => {
        setIsRefreshing(true);
        try {
            await Promise.all([
                portfolioContentRef.current?.refetchGraph?.(),
                dispatch(syncAllAccountsWithBlockchainThunk()),
            ]);
        } catch (error) {
            // Do nothing
        }
        setIsRefreshing(false);
    }, [dispatch]);

    const refreshControl = useMemo(() => {
        if (isPortfolioEmpty) return undefined;

        return (
            <RefreshControl
                refreshing={isRefreshing}
                onRefresh={handleRefresh}
                colors={[colors.backgroundPrimaryDefault]}
            />
        );
    }, [isPortfolioEmpty, handleRefresh, colors, isRefreshing]);

    return (
        <Screen
            screenHeader={<DeviceManagerScreenHeader hasBottomPadding />}
            refreshControl={refreshControl}
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
