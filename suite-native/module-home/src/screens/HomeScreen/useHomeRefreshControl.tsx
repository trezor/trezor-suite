import { type RefObject, useCallback, useMemo, useState } from 'react';
import { RefreshControl } from 'react-native';
import { useDispatch } from 'react-redux';

import { syncAllAccountsWithBlockchainThunk } from '@suite-native/blockchain';
import { useNativeStyles } from '@trezor/styles-native';

import { type PortfolioGraphRef } from './components/PortfolioGraph';

export const useHomeRefreshControl = ({
    isDiscoveredDeviceAccountless,
    portfolioGraphRef,
}: {
    isDiscoveredDeviceAccountless: boolean;
    portfolioGraphRef: RefObject<PortfolioGraphRef | null>;
}) => {
    const [isRefreshing, setIsRefreshing] = useState(false);
    const dispatch = useDispatch();
    const {
        utils: { colors },
    } = useNativeStyles();

    const handleRefresh = useCallback(async () => {
        setIsRefreshing(true);
        try {
            await Promise.all([
                portfolioGraphRef.current?.refetchGraph({ forceRefetch: true }),
                dispatch(syncAllAccountsWithBlockchainThunk()),
            ]);
        } catch {
            // Do nothing
        }
        setIsRefreshing(false);
    }, [dispatch, portfolioGraphRef]);

    const refreshControl = useMemo(() => {
        if (isDiscoveredDeviceAccountless) return undefined;

        return (
            <RefreshControl
                refreshing={isRefreshing}
                onRefresh={handleRefresh}
                colors={[colors.legacyBackgroundPrimaryDefault]}
            />
        );
    }, [isDiscoveredDeviceAccountless, handleRefresh, colors, isRefreshing]);

    return refreshControl;
};
