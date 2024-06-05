import { useCallback, useMemo, useState } from 'react';
import { RefreshControl } from 'react-native';
import { useDispatch } from 'react-redux';

import { syncAllAccountsWithBlockchainThunk } from '@suite-native/blockchain';
import { useNativeStyles } from '@trezor/styles';

import { PortfolioGraphRef } from './components/PortfolioGraph';

export const useHomeRefreshControl = ({
    isEmptyDevice,
    portfolioContentRef,
}: {
    isEmptyDevice: boolean;
    portfolioContentRef: React.MutableRefObject<PortfolioGraphRef | null>;
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
                portfolioContentRef.current?.refetchGraph?.(),
                dispatch(syncAllAccountsWithBlockchainThunk()),
            ]);
        } catch (error) {
            // Do nothing
        }
        setIsRefreshing(false);
    }, [dispatch, portfolioContentRef]);

    const refreshControl = useMemo(() => {
        if (isEmptyDevice) return undefined;

        return (
            <RefreshControl
                refreshing={isRefreshing}
                onRefresh={handleRefresh}
                colors={[colors.backgroundPrimaryDefault]}
            />
        );
    }, [isEmptyDevice, handleRefresh, colors, isRefreshing]);

    return refreshControl;
};
