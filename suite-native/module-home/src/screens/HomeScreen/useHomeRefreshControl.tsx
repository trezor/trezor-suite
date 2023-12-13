import { useCallback, useMemo, useState } from 'react';
import { RefreshControl } from 'react-native';
import { useDispatch } from 'react-redux';

import { syncAllAccountsWithBlockchainThunk } from '@suite-native/blockchain';
import { useNativeStyles } from '@trezor/styles';

import { PortfolioContentRef } from './components/PortfolioContent';

export const useHomeRefreshControl = ({
    isPortfolioEmpty,
    portfolioContentRef,
}: {
    isPortfolioEmpty: boolean;
    portfolioContentRef: React.MutableRefObject<PortfolioContentRef | null>;
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
        if (isPortfolioEmpty) return undefined;

        return (
            <RefreshControl
                refreshing={isRefreshing}
                onRefresh={handleRefresh}
                colors={[colors.backgroundPrimaryDefault]}
            />
        );
    }, [isPortfolioEmpty, handleRefresh, colors, isRefreshing]);

    return refreshControl;
};
