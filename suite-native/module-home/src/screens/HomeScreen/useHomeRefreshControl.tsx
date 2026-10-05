import { type RefObject, useCallback, useMemo, useState } from 'react';
import { RefreshControl } from 'react-native';
import { useSelector } from 'react-redux';

import { useServices } from '@suite-common/dependency-injection';
import { injectDispatch } from '@suite-common/redux-utils';
import { selectCanUseAppServices } from '@suite-native/app-init';
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
    const { dispatch } = useServices(injectDispatch);
    const canUseAppServices = useSelector(selectCanUseAppServices);
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
        if (!canUseAppServices || isDiscoveredDeviceAccountless) return undefined;

        return (
            <RefreshControl
                refreshing={isRefreshing}
                onRefresh={handleRefresh}
                colors={[colors.elementFillBrandBold]}
            />
        );
    }, [canUseAppServices, isDiscoveredDeviceAccountless, handleRefresh, colors, isRefreshing]);

    return refreshControl;
};
