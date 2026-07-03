import { useCallback, useMemo, useState } from 'react';
import { RefreshControl } from 'react-native';
import { useDispatch } from 'react-redux';

import { syncAllAccountsWithBlockchainThunk } from '@suite-native/blockchain';
import { refetchPortfolioGraphThunk } from '@suite-native/graph';
import { useNativeStyles } from '@trezor/styles-native';

export const useHomeRefreshControl = ({
    isDiscoveredDeviceAccountless,
}: {
    isDiscoveredDeviceAccountless: boolean;
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
                dispatch(refetchPortfolioGraphThunk({ forceRefetch: true })),
                dispatch(syncAllAccountsWithBlockchainThunk()),
            ]);
        } catch {
            // Do nothing
        }
        setIsRefreshing(false);
    }, [dispatch]);

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
